import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Post, Query, Redirect, Render } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { InsulationMaterial, InsulationMaterialStatus } from '../database/entities/insulation-materials.entity';

const DEMO_USER_ID = 1;
const DEFAULT_IMAGE_URL = '/insulation-materials-assets/default-media/default-insulation.jpg';
const DEFAULT_VIDEO_URL = '/insulation-materials-assets/default-media/default-insulation.mp4';
const DELETE_CURSOR_NAME = 'insulation_materials_delete_cursor';

@Controller('insulation-materials')
export class InsulationMaterialsController {
  constructor(
    @InjectRepository(InsulationMaterial) private readonly insulationMaterialsRepository: Repository<InsulationMaterial>,
    private readonly dataSource: DataSource,
  ) {}

  private presentInsulationMaterial(material: InsulationMaterial) {
    return {
      insulationMaterialId: material.insulationMaterialId,
      insulationMaterialName: material.name,
      insulationMaterialDescription: material.shortDescription ?? '',
      insulationMaterialStatus: material.status,
      insulationMaterialImageUrl: material.imageUrl?.trim() || DEFAULT_IMAGE_URL,
      insulationMaterialVideoUrl: material.videoUrl?.trim() || DEFAULT_VIDEO_URL,
      insulationMaterialDefaultImageUrl: DEFAULT_IMAGE_URL,
      insulationMaterialDefaultVideoUrl: DEFAULT_VIDEO_URL,
      insulationMaterialPosterUrl: material.imageUrl?.trim() || DEFAULT_IMAGE_URL,
      insulationMaterialType: material.insulationType ?? '',
      insulationMaterialThicknessMm: material.thicknessMm ?? '',
      insulationMaterialLikeCount: material.insulationLikeCount ?? 0,
      insulationMaterialBrief: material.shortDescription
        ? material.shortDescription.split('. ')[0].replace(/\.?$/, '.')
        : 'Описание будет добавлено перед публикацией.',
    };
  }

  private publishedInsulationMaterialsQuery(): SelectQueryBuilder<InsulationMaterial> {
    return this.withInsulationMaterialLikeCount(this.insulationMaterialsRepository.createQueryBuilder('insulationMaterial'))
      .where('insulationMaterial.status = :status', { status: InsulationMaterialStatus.Published });
  }

  private withInsulationMaterialLikeCount(query: SelectQueryBuilder<InsulationMaterial>) {
    return query.addSelect(
      subQuery => subQuery
        .select('COUNT(*)')
        .from('insulation_material_likes', 'insulationMaterialLike')
        .where('insulationMaterialLike.insulation_material_id = insulationMaterial.insulation_material_id'),
      'insulationMaterialLikeCount',
    );
  }

  private async getInsulationMaterialsWithLikeCount(query: SelectQueryBuilder<InsulationMaterial>) {
    const { entities, raw } = await query.getRawAndEntities();
    entities.forEach((material, index) => {
      material.insulationLikeCount = Number(raw[index]?.insulationMaterialLikeCount ?? 0);
    });
    return entities;
  }

  private async getInsulationMaterialWithLikeCount(query: SelectQueryBuilder<InsulationMaterial>) {
    const materials = await this.getInsulationMaterialsWithLikeCount(query.take(1));
    return materials[0] ?? null;
  }

  // GET 1/3 — получение одной опубликованной услуги через ORM.
  @Get('feed{/:insulationMaterialId}')
  @Render('insulation-materials-feed')
  async getInsulationMaterialsFeed(
    @Param('insulationMaterialId') insulationMaterialId?: string,
    @Query('next') next?: string,
  ) {
    if (next !== undefined && next !== 'true') throw new BadRequestException('Параметр next должен быть true');
    if (insulationMaterialId !== undefined && !/^[1-9]\d*$/.test(insulationMaterialId)) throw new NotFoundException('Материал не найден');

    const currentId = insulationMaterialId === undefined ? undefined : Number(insulationMaterialId);
    let insulationMaterial: InsulationMaterial | null;

    if (next === 'true' && currentId !== undefined) {
      insulationMaterial = await this.getInsulationMaterialWithLikeCount(this.publishedInsulationMaterialsQuery()
        .andWhere('insulationMaterial.insulationMaterialId > :currentId', { currentId })
        .orderBy('insulationMaterial.insulationMaterialId', 'ASC'));
      insulationMaterial ??= await this.getInsulationMaterialWithLikeCount(this.publishedInsulationMaterialsQuery()
        .orderBy('insulationMaterial.insulationMaterialId', 'ASC'));
    } else {
      const query = this.publishedInsulationMaterialsQuery();
      if (currentId !== undefined) query.andWhere('insulationMaterial.insulationMaterialId = :currentId', { currentId });
      insulationMaterial = await this.getInsulationMaterialWithLikeCount(query.orderBy('insulationMaterial.insulationMaterialId', 'ASC'));
    }

    if (!insulationMaterial) throw new NotFoundException('Материал не найден');
    return {
      insulationMaterial: this.presentInsulationMaterial(insulationMaterial),
      insulationMaterialsFeedActive: true,
      insulationMaterialsPageTitle: 'Лента материалов — Теплощит',
    };
  }

  // GET 2/3 — поиск услуг по максимальной толщине через ORM.
  @Get('catalog')
  @Render('insulation-materials-catalog')
  async getInsulationMaterialsCatalog(@Query('insulationMaterialsMaxThickness') rawMaxThickness?: string) {
    const source = typeof rawMaxThickness === 'string' ? rawMaxThickness.trim() : '';
    const valid = source === '' || /^\d{1,4}$/.test(source);
    const maxThickness = source === '' ? 1000 : Number(source);
    const filterError = !valid || maxThickness < 1 || maxThickness > 1000
      ? 'Укажите максимальную толщину от 1 до 1000 мм.'
      : '';
    const query = this.publishedInsulationMaterialsQuery().orderBy('insulationMaterial.insulationMaterialId', 'ASC');
    if (!filterError) query.andWhere('insulationMaterial.thicknessMm <= :maxThickness', { maxThickness });
    else query.andWhere('1 = 0');
    const insulationMaterials = await this.getInsulationMaterialsWithLikeCount(query);
    return {
      insulationMaterials: insulationMaterials.map(material => this.presentInsulationMaterial(material)),
      insulationMaterialsCount: insulationMaterials.length,
      insulationMaterialsFilterValue: filterError ? '1000' : String(maxThickness),
      insulationMaterialsFilterError: filterError,
      insulationMaterialsCatalogActive: true,
      insulationMaterialsPageTitle: 'Каталог материалов — Теплощит',
    };
  }

  // GET 3/3 — получение единственного черновика пользователя через ORM.
  @Get('draft')
  @Render('insulation-materials-draft')
  async getInsulationMaterialsDraft() {
    const draft = await this.getInsulationMaterialWithLikeCount(this.withInsulationMaterialLikeCount(
      this.insulationMaterialsRepository.createQueryBuilder('insulationMaterial'),
    )
      .where('insulationMaterial.creatorId = :creatorId AND insulationMaterial.status = :status', {
        creatorId: DEMO_USER_ID,
        status: InsulationMaterialStatus.Draft,
      }));
    return {
      insulationMaterial: draft ? this.presentInsulationMaterial(draft) : null,
      insulationMaterialsHasDraft: Boolean(draft),
      insulationMaterialsDraftActive: true,
      insulationMaterialsPageTitle: draft ? 'Публикация материала — Теплощит' : 'Добавление материала — Теплощит',
    };
  }

  // POST 1/3 — создание черновика через ORM. Фото и видео необязательны и не передаются серверу.
  @Post('draft')
  @Redirect('/insulation-materials/draft', 303)
  async createInsulationMaterialsDraft(@Body('insulationMaterialName') rawName?: string) {
    const name = rawName?.trim();
    if (!name || name.length > 120) throw new BadRequestException('Укажите название длиной до 120 символов');
    const existingDraft = await this.insulationMaterialsRepository.findOneBy({
      creatorId: DEMO_USER_ID,
      status: InsulationMaterialStatus.Draft,
    });
    if (existingDraft) return;
    await this.insulationMaterialsRepository.save(this.insulationMaterialsRepository.create({
      name,
      creatorId: DEMO_USER_ID,
      status: InsulationMaterialStatus.Draft,
      imageUrl: null,
      videoUrl: null,
    }));
  }

  // POST 2/3 — публикация черновика через ORM.
  @Post('publish')
  @Redirect('/insulation-materials/feed', 303)
  async publishInsulationMaterialsDraft(@Body() body: Record<string, string>) {
    const draft = await this.insulationMaterialsRepository.findOneBy({
      creatorId: DEMO_USER_ID,
      status: InsulationMaterialStatus.Draft,
    });
    if (!draft) throw new NotFoundException('Черновик материала не найден');
    const description = body.insulationMaterialDescription?.trim();
    const insulationType = body.insulationMaterialType?.trim();
    const thicknessMm = Number(body.insulationMaterialThicknessMm);
    if (!description || description.length > 300) throw new BadRequestException('Заполните краткую информацию длиной до 300 символов');
    if (!insulationType || insulationType.length > 50) throw new BadRequestException('Заполните тип утеплителя длиной до 50 символов');
    if (!Number.isInteger(thicknessMm) || thicknessMm < 1 || thicknessMm > 1000) throw new BadRequestException('Толщина должна быть целым числом от 1 до 1000 мм');
    draft.shortDescription = description;
    draft.insulationType = insulationType;
    draft.thicknessMm = thicknessMm;
    draft.status = InsulationMaterialStatus.Published;
    draft.publishedAt = new Date();
    await this.insulationMaterialsRepository.save(draft);
    return { url: `/insulation-materials/feed/${draft.insulationMaterialId}` };
  }

  // POST 3/3 — логическое удаление сырой SQL-командой через PostgreSQL-курсор.
  @Post(':insulationMaterialId/delete')
  @Redirect('/insulation-materials/catalog', 303)
  async deleteInsulationMaterial(@Param('insulationMaterialId') insulationMaterialId: string) {
    if (!/^[1-9]\d*$/.test(insulationMaterialId)) throw new NotFoundException('Материал не найден');
    const cursor = this.dataSource.createQueryRunner();
    await cursor.connect();
    await cursor.startTransaction();
    try {
      await cursor.query(
        `DECLARE ${DELETE_CURSOR_NAME} NO SCROLL CURSOR FOR
         SELECT insulation_material_id
         FROM insulation_materials
         WHERE insulation_material_id = $1 AND creator_id = $2 AND status <> $3
         FOR UPDATE`,
        [Number(insulationMaterialId), DEMO_USER_ID, InsulationMaterialStatus.Deleted],
      );
      const selected: Array<{ insulation_material_id: number }> = await cursor.query(`FETCH NEXT FROM ${DELETE_CURSOR_NAME}`);
      if (!selected.length) throw new NotFoundException('Материал не найден');
      await cursor.query(
        `UPDATE insulation_materials
         SET status = $1
         WHERE CURRENT OF ${DELETE_CURSOR_NAME}`,
        [InsulationMaterialStatus.Deleted],
      );
      await cursor.query(`CLOSE ${DELETE_CURSOR_NAME}`);
      await cursor.commitTransaction();
    } catch (error) {
      await cursor.rollbackTransaction();
      throw error;
    } finally {
      await cursor.release();
    }
  }
}
