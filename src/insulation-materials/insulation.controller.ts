import { BadRequestException, Controller, Get, NotFoundException, Param, Query, Render } from '@nestjs/common';
import { insulationMaterials, InsulationMaterial } from './insulation-materials.collection';

@Controller('insulation-materials')
export class InsulationController {
  private presentInsulation(insulation: InsulationMaterial) {
    const insulationMediaBase = `${(process.env.MINIO_PUBLIC_URL || 'http://localhost:9010').replace(/\/$/, '')}/${process.env.MINIO_BUCKET || 'insulation-materials'}`;
    return {
      ...insulation,
      insulationLikeCount: insulation.insulationLikes.length,
      insulationPriceLabel: new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(insulation.insulationPriceRubM2),
      insulationImageUrl: `${insulationMediaBase}/${insulation.insulationImageKey}?v=5`,
      insulationVideoUrl: `${insulationMediaBase}/${insulation.insulationVideoKey}?v=5`,
      insulationPosterUrl: `${insulationMediaBase}/${insulation.insulationVideoKey.replace(/\.mp4$/, '-poster.jpg')}?v=5`,
      insulationBrief: insulation.insulationDescription.split('. ')[0] + '.',
    };
  }

  // Express 5: braces make the ID segment optional. One GET handler, with/without ID.
  @Get('feed{/:insulationId}')
  @Render('insulation-material-feed')
  getInsulationFeed(@Param('insulationId') insulationId?: string, @Query('next') next?: string) {
    const publishedInsulation = insulationMaterials.filter(material => material.insulationStatus === 'published');
    let insulationIndex = 0;
    if (insulationId !== undefined) {
      if (!/^[1-9]\d*$/.test(insulationId)) throw new NotFoundException('Материал не найден');
      insulationIndex = publishedInsulation.findIndex(material => material.insulationId === Number(insulationId));
      if (insulationIndex < 0) throw new NotFoundException('Материал не найден');
    }
    if (next !== undefined && next !== 'true' && next !== 'false') throw new BadRequestException('Параметр next должен быть true или false');
    if (next === 'true' && insulationId !== undefined) insulationIndex = (insulationIndex + 1) % publishedInsulation.length;
    const insulation = publishedInsulation[insulationIndex];
    if (!insulation) throw new NotFoundException('Нет опубликованных материалов');
    return { insulation: this.presentInsulation(insulation), insulationFeedActive: true, insulationPageTitle: 'Лента материалов — Теплощит' };
  }

  @Get('draft')
  @Render('insulation-material-draft')
  getInsulationDraft() {
    const insulation = insulationMaterials.find(material => material.insulationStatus === 'draft');
    if (!insulation) throw new NotFoundException('Черновик материала не найден');
    return { insulation: this.presentInsulation(insulation), insulationDraftActive: true, insulationPageTitle: 'Черновик материала — Теплощит' };
  }

  @Get('catalog')
  @Render('insulation-material-catalog')
  getInsulationCatalog(@Query('insulationMaxPrice') insulationMaxPrice?: string) {
    const insulationFilterValue = typeof insulationMaxPrice === 'string' ? insulationMaxPrice : '';
    const insulationFilterValid = insulationMaxPrice === undefined || (typeof insulationMaxPrice === 'string' && (insulationMaxPrice.trim() === '' || /^\d+(?:[.,]\d{1,2})?$/.test(insulationMaxPrice.trim())));
    const insulationPriceLimit = insulationFilterValue.trim() === '' ? Infinity : Number(insulationFilterValue.trim().replace(',', '.'));
    const insulationFilterError = !insulationFilterValid || Number.isNaN(insulationPriceLimit) ? 'Введите неотрицательную цену числом, например 1300.' : '';
    const foundInsulation = insulationFilterError ? [] : insulationMaterials.filter(material => material.insulationStatus === 'published' && material.insulationPriceRubM2 <= insulationPriceLimit);
    return {
      insulationMaterials: foundInsulation.map(material => this.presentInsulation(material)),
      insulationMaterialCount: foundInsulation.length, insulationFilterValue, insulationFilterError,
      insulationCatalogActive: true, insulationPageTitle: 'Каталог материалов — Теплощит'
    };
  }
}
