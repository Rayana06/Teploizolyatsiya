import { ApiProperty } from '@nestjs/swagger';

export class CreateInsulationMaterialDto {
  @ApiProperty({ example: 'Технолайт Оптима 100', maxLength: 120 })
  name!: string;

  @ApiProperty({ example: 'Каменная вата для утепления каркасных стен.', maxLength: 300 })
  shortDescription!: string;

  @ApiProperty({ example: 'Минвата', maxLength: 50 })
  insulationType!: string;

  @ApiProperty({ example: 100, minimum: 1, maximum: 1000 })
  thicknessMm!: number;

  @ApiProperty({ type: 'string', format: 'binary', description: 'Изображение материала' })
  image!: unknown;

  @ApiProperty({ type: 'string', format: 'binary', description: 'Короткое видео материала' })
  video!: unknown;
}

export class SetLikeDto {
  @ApiProperty({ enum: [0, 1], example: 1, description: '1 — поставить лайк, 0 — снять' })
  liked!: 0 | 1;
}
