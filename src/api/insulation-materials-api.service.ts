import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { InsulationMaterialLike } from '../database/entities/insulation-materials-like.entity';
import { InsulationMaterial, InsulationMaterialStatus } from '../database/entities/insulation-materials.entity';
import { MinioStorageService, UploadedMediaFile } from '../storage/minio-storage.service';
import { InsulationMaterialSerializer } from './insulation-material.serializer';

interface CreateMaterialInput {
  name?: string;
  shortDescription?: string;
  insulationType?: string;
  thicknessMm?: string | number;
  [key: string]: unknown;
}

@Injectable()
export class InsulationMaterialsApiService {
  private readonly serializer: InsulationMaterialSerializer;

  constructor(
    // ДЛЯ ЗАЩИТЫ: Repository — это ORM TypeORM. Через него код работает с таблицами без ручного SQL.
    @InjectRepository(InsulationMaterial) private readonly materials: Repository<InsulationMaterial>,
    @InjectRepository(InsulationMaterialLike) private readonly likes: Repository<InsulationMaterialLike>,
    private readonly dataSource: DataSource,
    private readonly storage: MinioStorageService,
  ) {
    this.serializer = new InsulationMaterialSerializer(storage);
  }

  private rejectSystemFields(body: Record<string, unknown>): void {
    // Системные поля нельзя присылать с клиента: их рассчитывает бизнес-логика сервера.
    const forbidden = [
      'id', 'insulationMaterialId', 'insulation_material_id', 'status',
      'creatorId', 'creator_id', 'moderatorId', 'moderator_id',
      'createdAt', 'created_at', 'publishedAt', 'published_at', 'completedAt', 'completed_at',
    ];
    const received = forbidden.filter(field => body[field] !== undefined);
    if (received.length) throw new BadRequestException(`Системные поля запрещены: ${received.join(', ')}`);
  }

  private publishedQuery(): SelectQueryBuilder<InsulationMaterial> {
    // Общая часть запросов каталога и ленты: draft и deleted никогда не уходят клиенту.
    return this.materials.createQueryBuilder('material')
      .where('material.status = :status', { status: InsulationMaterialStatus.Published });
  }

  private async serializeList(query: SelectQueryBuilder<InsulationMaterial>, currentUserId?: number) {
    // Для каталога считаем лайки, но не ищем liked: этот признак относится к ленте.
    const entities = await query
      .loadRelationCountAndMap('material.insulationLikeCount', 'material.likes')
      .getMany();
    return entities.map(material => this.serializer.serializeList(material, {
      currentUserId,
      likeCount: material.insulationLikeCount,
    }));
  }

  private async serializeFeed(query: SelectQueryBuilder<InsulationMaterial>, currentUserId?: number) {
    // Лента возвращает один элемент и отдельный признак liked: 0/1 для текущего пользователя.
    const entities = await query
      .loadRelationCountAndMap('material.insulationLikeCount', 'material.likes')
      .getMany();
    const likedRows = entities.length && currentUserId !== undefined ? await this.likes.createQueryBuilder('like')
      .innerJoin('like.insulationMaterial', 'material')
      .select('material.insulationMaterialId', 'materialId')
      .where('like.user = :currentUserId', { currentUserId })
      .andWhere('material.insulationMaterialId IN (:...ids)', { ids: entities.map(entity => entity.insulationMaterialId) })
      .getRawMany<{ materialId: number }>() : [];
    const likedIds = new Set(likedRows.map(row => Number(row.materialId)));
    return entities.map(material => this.serializer.serializeFeed(material, {
      currentUserId,
      likeCount: material.insulationLikeCount,
      liked: likedIds.has(material.insulationMaterialId),
    }));
  }

  async list(query: Record<string, string | undefined>, currentUserId?: number) {
    // Фильтрация выполняется на бэкенде до чтения результата из БД.
    const builder = this.publishedQuery().orderBy('material.insulationMaterialId', 'ASC');
    if (query.maxThicknessMm !== undefined) {
      const value = Number(query.maxThicknessMm);
      if (!Number.isInteger(value) || value < 1 || value > 1000) throw new BadRequestException('maxThicknessMm: целое число от 1 до 1000');
      builder.andWhere('material.thicknessMm <= :maxThicknessMm', { maxThicknessMm: value });
    }
    if (query.insulationType?.trim()) builder.andWhere('LOWER(material.insulationType) = LOWER(:insulationType)', { insulationType: query.insulationType.trim() });
    if (query.search?.trim()) builder.andWhere('LOWER(material.name) LIKE LOWER(:search)', { search: `%${query.search.trim()}%` });
    const items = await this.serializeList(builder, currentUserId);
    return { items, count: items.length };
  }

  async feed(rawId?: string, next?: string, currentUserId?: number) {
    // Без id и параметров начинается просмотр ленты: возвращается первый опубликованный элемент.
    // Для кнопки «Далее» обязательны одновременно id текущего элемента и next=true.
    if (next !== undefined && next !== 'true') throw new BadRequestException('next может быть только true');
    if (rawId !== undefined && !/^[1-9]\d*$/.test(rawId)) throw new NotFoundException('Услуга не найдена');
    const id = rawId ? Number(rawId) : undefined;
    if (id !== undefined && next !== 'true') throw new BadRequestException('Для URL с id требуется параметр next=true');
    if (id === undefined && next === 'true') throw new BadRequestException('Для next=true требуется id текущей услуги в URL');
    let items;
    if (next === 'true') {
      items = await this.serializeFeed(this.publishedQuery()
        .andWhere('material.insulationMaterialId > :id', { id })
        .orderBy('material.insulationMaterialId', 'ASC').take(1), currentUserId);
      // Если курсор указывает на последний элемент, лента циклически возвращается к первому.
      if (!items.length) items = await this.serializeFeed(this.publishedQuery().orderBy('material.insulationMaterialId', 'ASC').take(1), currentUserId);
    } else {
      items = await this.serializeFeed(this.publishedQuery().orderBy('material.insulationMaterialId', 'ASC').take(1), currentUserId);
    }
    if (!items.length) throw new NotFoundException('Услуга не найдена');
    return items[0];
  }

  async draft(currentUserId: number) {
    // Частичный уникальный индекс в БД и эта проверка обеспечивают не более одного черновика.
    const material = await this.materials.findOneBy({ creatorId: currentUserId, status: InsulationMaterialStatus.Draft });
    return material ? this.serializer.serialize(material, { currentUserId }) : null;
  }

  async create(currentUserId: number, body: CreateMaterialInput, image: UploadedMediaFile | undefined, video: UploadedMediaFile | undefined) {
    this.rejectSystemFields(body);
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const shortDescription = typeof body.shortDescription === 'string' ? body.shortDescription.trim() : '';
    const insulationType = typeof body.insulationType === 'string' ? body.insulationType.trim() : '';
    const thicknessMm = Number(body.thicknessMm);
    if (!name || name.length > 120) throw new BadRequestException('name: обязательная строка до 120 символов');
    if (!shortDescription || shortDescription.length > 300) throw new BadRequestException('shortDescription: обязательная строка до 300 символов');
    if (!insulationType || insulationType.length > 50) throw new BadRequestException('insulationType: обязательная строка до 50 символов');
    if (!Number.isInteger(thicknessMm) || thicknessMm < 1 || thicknessMm > 1000) throw new BadRequestException('thicknessMm: целое число от 1 до 1000');
    if (!image || !video) throw new BadRequestException('Передайте файлы image и video');
    const existing = await this.materials.findOneBy({ creatorId: currentUserId, status: InsulationMaterialStatus.Draft });
    if (existing) throw new ConflictException('У пользователя уже есть черновик');

    // Сначала файлы загружаются в MinIO, затем их сгенерированные имена сохраняются в PostgreSQL.
    const imageName = await this.storage.upload(image, 'image');
    let videoName: string | null = null;
    try {
      videoName = await this.storage.upload(video, 'video');
      const material = await this.materials.save(this.materials.create({
        name, shortDescription, insulationType, thicknessMm,
        imageUrl: imageName, videoUrl: videoName,
        creatorId: currentUserId, status: InsulationMaterialStatus.Draft,
      }));
      return this.serializer.serialize(material, { currentUserId });
    } catch (error) {
      // Компенсация: если видео или запись БД не сохранились, уже загруженные файлы удаляются из MinIO.
      await Promise.all([this.storage.remove(imageName), this.storage.remove(videoName)]);
      throw error;
    }
  }

  async publish(currentUserId: number, rawId: string, body: Record<string, unknown>) {
    this.rejectSystemFields(body);
    if (!/^[1-9]\d*$/.test(rawId)) throw new NotFoundException('Черновик не найден');
    if (Object.keys(body).length) throw new BadRequestException('Публикация не принимает изменяемые поля');
    const material = await this.materials.findOneBy({ insulationMaterialId: Number(rawId), status: InsulationMaterialStatus.Draft });
    if (!material) throw new NotFoundException('Черновик не найден');
    if (material.creatorId !== currentUserId) throw new ForbiddenException('Можно публиковать только свою услугу');
    // Разрешённый переход статуса только draft -> published, причём только для автора услуги.
    material.status = InsulationMaterialStatus.Published;
    material.publishedAt = new Date();
    await this.materials.save(material);
    return this.serializer.serialize(material, { currentUserId });
  }

  async softDelete(currentUserId: number, rawId: string) {
    if (!/^[1-9]\d*$/.test(rawId)) throw new NotFoundException('Услуга не найдена');
    const material = await this.materials.findOneBy({ insulationMaterialId: Number(rawId) });
    if (!material || material.status === InsulationMaterialStatus.Deleted) throw new NotFoundException('Услуга не найдена');
    if (material.creatorId !== currentUserId) throw new ForbiddenException('Можно удалять только свою услугу');
    // DELETE не удаляет строку физически: ORM выполняет UPDATE статуса и даты завершения.
    const result = await this.materials.createQueryBuilder()
      .update(InsulationMaterial)
      .set({ status: InsulationMaterialStatus.Deleted, completedAt: new Date() })
      .where('insulation_material_id = :id', { id: Number(rawId) })
      .andWhere('creator_id = :creatorId', { creatorId: currentUserId })
      .andWhere('status IN (:...statuses)', { statuses: [InsulationMaterialStatus.Draft, InsulationMaterialStatus.Published] })
      .execute();
    if (!result.affected) throw new NotFoundException('Услуга этого пользователя не найдена');
  }

  async setLike(currentUserId: number, rawId: string, rawLiked: unknown) {
    if (!/^[1-9]\d*$/.test(rawId)) throw new NotFoundException('Услуга не найдена');
    if (rawLiked !== 0 && rawLiked !== 1) throw new BadRequestException('liked должен быть числом 0 или 1');
    const material = await this.materials.findOneBy({ insulationMaterialId: Number(rawId), status: InsulationMaterialStatus.Published });
    if (!material) throw new NotFoundException('Опубликованная услуга не найдена');
    const userId = currentUserId;
    // ДЛЯ ЗАЩИТЫ: лайки хранятся в связующей таблице insulation_material_likes.
    // Транзакция гарантирует целостное добавление или удаление лайка.
    await this.dataSource.transaction(async manager => {
      if (rawLiked === 1) {
        // Уникальный индекс и orIgnore не дают одному пользователю поставить два одинаковых лайка.
        await manager.createQueryBuilder().insert().into(InsulationMaterialLike)
          .values({ user: { userId }, insulationMaterial: { insulationMaterialId: material.insulationMaterialId } })
          .orIgnore().execute();
      } else {
        await manager.createQueryBuilder().delete().from(InsulationMaterialLike)
          .where('user_id = :userId AND insulation_material_id = :materialId', { userId, materialId: material.insulationMaterialId }).execute();
      }
    });
    const likeCount = await this.likes.createQueryBuilder('like')
      .where('like.insulationMaterial = :materialId', { materialId: material.insulationMaterialId }).getCount();
    return { id: material.insulationMaterialId, liked: rawLiked, likeCount };
  }
}
