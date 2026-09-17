import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';
import { InsulationMaterialLike } from './insulation-material-like.entity';

export enum InsulationMaterialStatus {
  Draft = 'draft',
  Published = 'published',
  Deleted = 'deleted',
}

@Entity({ name: 'insulation_materials' })
@Index('uq_insulation_materials_one_draft_per_creator', ['creatorId'], { unique: true, where: `"status" = 'draft'` })
export class InsulationMaterial {
  @PrimaryGeneratedColumn({ name: 'insulation_material_id', type: 'integer' })
  insulationMaterialId!: number;

  @Column({ name: 'name', type: 'varchar', length: 120 })
  name!: string;

  @Column({ name: 'short_description', type: 'varchar', length: 300, nullable: true })
  shortDescription!: string | null;

  @Column({ name: 'status', type: 'enum', enum: InsulationMaterialStatus, enumName: 'insulation_material_status', default: InsulationMaterialStatus.Draft })
  status!: InsulationMaterialStatus;

  @Column({ name: 'image_url', type: 'varchar', length: 500, nullable: true })
  imageUrl!: string | null;

  @Column({ name: 'video_url', type: 'varchar', length: 500, nullable: true })
  videoUrl!: string | null;

  @Column({ name: 'insulation_type', type: 'varchar', length: 50, nullable: true })
  insulationType!: string | null;

  @Column({ name: 'thickness_mm', type: 'smallint', nullable: true })
  thicknessMm!: number | null;

  @Column({ name: 'manufacturer', type: 'varchar', length: 100, nullable: true })
  manufacturer!: string | null;

  @Column({ name: 'application_area', type: 'varchar', length: 120, nullable: true })
  applicationArea!: string | null;

  @Column({ name: 'sku', type: 'varchar', length: 40, nullable: true })
  sku!: string | null;

  @Column({ name: 'price_rub_m2', type: 'numeric', precision: 10, scale: 2, nullable: true })
  priceRubM2!: string | null;

  @Column({ name: 'source_url', type: 'varchar', length: 500, nullable: true })
  sourceUrl!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt!: Date | null;

  @Column({ name: 'creator_id', type: 'integer' })
  creatorId!: number;

  @ManyToOne(() => User, user => user.insulationMaterials, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'creator_id', referencedColumnName: 'userId', foreignKeyConstraintName: 'fk_insulation_materials_creator' })
  creator!: User;

  @OneToMany(() => InsulationMaterialLike, like => like.insulationMaterial)
  likes!: InsulationMaterialLike[];
}
