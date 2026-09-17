import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Post, Query, Redirect, Render } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { InsulationMaterial, InsulationMaterialStatus } from '../database/entities/insulation-material.entity';

const DEMO_USER_ID = 1;
const DEFAULT_IMAGE_URL = '/insulation-assets/default-media/default-insulation.jpg';
const DEFAULT_VIDEO_URL = '/insulation-assets/default-media/default-insulation.mp4';

@Controller('insulation-materials')
export class InsulationController {
  constructor(
    @InjectRepository(InsulationMaterial) private readonly insulationRepository: Repository<InsulationMaterial>,
    private readonly dataSource: DataSource,
  ) {}

  private presentInsulation(material: InsulationMaterial & { insulationLikeCount?: number }) {
    const price = Number(material.priceRubM2 ?? 0);
    return {
      insulationId: material.insulationMaterialId,
      insulationName: material.name,
      insulationDescription: material.shortDescription ?? '',
      insulationStatus: material.status,
      insulationImageUrl: material.imageUrl?.trim() || DEFAULT_IMAGE_URL,
      insulationVideoUrl: material.videoUrl?.trim() || DEFAULT_VIDEO_URL,
      insulationDefaultImageUrl: DEFAULT_IMAGE_URL,
      insulationDefaultVideoUrl: DEFAULT_VIDEO_URL,
      insulationPosterUrl: material.imageUrl?.trim() || DEFAULT_IMAGE_URL,
      insulationType: material.insulationType ?? '',
      insulationThicknessMm: material.thicknessMm ?? '',
      insulationManufacturer: material.manufacturer ?? '',
      insulationApplication: material.applicationArea ?? '',
      insulationSku: material.sku ?? '',
      insulationPriceRubM2: material.priceRubM2 ?? '',
      insulationPriceLabel: new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price),
      insulationSourceUrl: material.sourceUrl ?? '',
      insulationLikeCount: material.insulationLikeCount ?? material.likes?.length ?? 0,
      insulationBrief: material.shortDescription ? material.shortDescription.split('. ')[0].replace(/\.?$/, '.') : 'Описание будет добавлено перед публикацией.',
    };
  }

  private publishedQuery() {
    return this.insulationRepository.createQueryBuilder('material')
      .leftJoinAndSelect('material.likes', 'likes')
      .where('material.status = :status', { status: InsulationMaterialStatus.Published });
  }

  // GET 1/3 — получение опубликованной услуги через ORM.
  @Get('feed{/:insulationId}')
  @Render('insulation-material-feed')
  async getInsulationFeed(@Param('insulationId') insulationId?: string, @Query('next') next?: string) {
    if (next !== undefined && next !== 'true' && next !== 'false') throw new BadRequestException('Параметр next должен быть true или false');
    if (insulationId !== undefined && !/^[1-9]\d*$/.test(insulationId)) throw new NotFoundException('Материал не найден');
    const materials = await this.publishedQuery().orderBy('material.insulationMaterialId', 'ASC').getMany();
    if (!materials.length) throw new NotFoundException('Нет опубликованных материалов');
    let index = insulationId === undefined ? 0 : materials.findIndex(material => material.insulationMaterialId === Number(insulationId));
    if (index < 0) throw new NotFoundException('Материал не найден');
    if (next === 'true' && insulationId !== undefined) index = (index + 1) % materials.length;
    return { insulation: this.presentInsulation(materials[index]), insulationFeedActive: true, insulationPageTitle: 'Лента материалов — Теплощит' };
  }

  // GET 2/3 — поиск услуг через ORM.
  @Get('catalog')
  @Render('insulation-material-catalog')
  async getInsulationCatalog(@Query('insulationMaxPrice') insulationMaxPrice?: string) {
    const source = typeof insulationMaxPrice === 'string' ? insulationMaxPrice.trim() : '';
    const valid = source === '' || /^\d+(?:[.,]\d{1,2})?$/.test(source);
    const parsedPrice = source === '' ? 1570.15 : Number(source.replace(',', '.'));
    const filterError = !valid || Number.isNaN(parsedPrice) || parsedPrice < 229.63 || parsedPrice > 1570.15
      ? 'Выберите максимальную цену от 229,63 до 1 570,15 ₽/м².'
      : '';
    const query = this.publishedQuery().orderBy('material.insulationMaterialId', 'ASC');
    if (!filterError) query.andWhere('material.priceRubM2 <= :maximumPrice', { maximumPrice: parsedPrice });
    else query.andWhere('1 = 0');
    const materials = await query.getMany();
    return {
      insulationMaterials: materials.map(material => this.presentInsulation(material)),
      insulationMaterialCount: materials.length,
      insulationFilterValue: filterError ? '1570.15' : String(parsedPrice),
      insulationFilterError: filterError,
      insulationCatalogActive: true,
      insulationPageTitle: 'Каталог материалов — Теплощит',
    };
  }

  // GET 3/3 — получение единственного черновика пользователя через ORM.
  @Get('draft')
  @Render('insulation-material-draft')
  async getInsulationDraft() {
    const draft = await this.insulationRepository.createQueryBuilder('material')
      .leftJoinAndSelect('material.likes', 'likes')
      .where('material.creatorId = :creatorId AND material.status = :status', { creatorId: DEMO_USER_ID, status: InsulationMaterialStatus.Draft })
      .getOne();
    return {
      insulation: draft ? this.presentInsulation(draft) : null,
      insulationHasDraft: Boolean(draft),
      insulationDraftActive: true,
      insulationPageTitle: draft ? 'Публикация материала — Теплощит' : 'Добавление материала — Теплощит',
    };
  }

  // POST 1/3 — создание черновика через ORM. Фото и видео намеренно не принимаются сервером.
  @Post('draft')
  @Redirect('/insulation-materials/draft', 303)
  async createInsulationDraft(@Body('insulationName') rawName?: string) {
    const name = rawName?.trim();
    if (!name || name.length > 120) throw new BadRequestException('Укажите название длиной до 120 символов');
    const existingDraft = await this.insulationRepository.findOneBy({ creatorId: DEMO_USER_ID, status: InsulationMaterialStatus.Draft });
    if (existingDraft) return;
    await this.insulationRepository.save(this.insulationRepository.create({
      name, creatorId: DEMO_USER_ID, status: InsulationMaterialStatus.Draft, imageUrl: null, videoUrl: null,
    }));
  }

  // POST 2/3 — заполнение и публикация черновика через ORM.
  @Post('publish')
  @Redirect('/insulation-materials/feed', 303)
  async publishInsulationDraft(@Body() body: Record<string, string>) {
    const draft = await this.insulationRepository.findOneBy({ creatorId: DEMO_USER_ID, status: InsulationMaterialStatus.Draft });
    if (!draft) throw new NotFoundException('Черновик материала не найден');
    const description = body.insulationDescription?.trim();
    const insulationType = body.insulationType?.trim();
    const thicknessMm = Number(body.insulationThicknessMm);
    if (!description || description.length > 300) throw new BadRequestException('Заполните краткую информацию длиной до 300 символов');
    if (!insulationType || insulationType.length > 50) throw new BadRequestException('Заполните тип утеплителя длиной до 50 символов');
    if (!Number.isInteger(thicknessMm) || thicknessMm < 1 || thicknessMm > 1000) throw new BadRequestException('Толщина должна быть целым числом от 1 до 1000 мм');
    draft.shortDescription = description;
    draft.insulationType = insulationType;
    draft.thicknessMm = thicknessMm;
    draft.manufacturer = body.insulationManufacturer?.trim().slice(0, 100) || null;
    draft.applicationArea = body.insulationApplication?.trim().slice(0, 120) || null;
    draft.sku = body.insulationSku?.trim().slice(0, 40) || null;
    const price = Number(String(body.insulationPriceRubM2 ?? '').replace(',', '.'));
    draft.priceRubM2 = Number.isFinite(price) && price >= 0 ? price.toFixed(2) : null;
    draft.status = InsulationMaterialStatus.Published;
    draft.publishedAt = new Date();
    await this.insulationRepository.save(draft);
    return { url: `/insulation-materials/feed/${draft.insulationMaterialId}` };
  }

  // POST 3/3 — логическое удаление. ORM не используется: SQL UPDATE выполняется через QueryRunner (курсор).
  @Post(':insulationId/delete')
  @Redirect('/insulation-materials/catalog', 303)
  async deleteInsulationMaterial(@Param('insulationId') insulationId: string) {
    if (!/^[1-9]\d*$/.test(insulationId)) throw new NotFoundException('Материал не найден');
    const cursor = this.dataSource.createQueryRunner();
    await cursor.connect();
    try {
      const result: Array<{ insulation_material_id: number }> = await cursor.query(
        `UPDATE insulation_materials
         SET status = $1
         WHERE insulation_material_id = $2 AND creator_id = $3 AND status <> $1
         RETURNING insulation_material_id`,
        [InsulationMaterialStatus.Deleted, Number(insulationId), DEMO_USER_ID],
      );
      if (!result.length) throw new NotFoundException('Материал не найден');
    } finally {
      await cursor.release();
    }
  }
}
