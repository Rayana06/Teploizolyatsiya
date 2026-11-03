import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';
import { InsulationMaterialLike } from './insulation-materials-like.entity';

export enum InsulationMaterialStatus {
  Draft = 'draft',
  Published = 'published',
  Deleted = 'deleted',
}

// ДЛЯ ЗАЩИТЫ: Entity описывает соответствие класса TypeScript таблице PostgreSQL.
// Декораторы Column задают столбцы, а отношения ManyToOne/OneToMany — внешние ключи.
@Entity({ name: 'insulation_materials' })
// Частичный уникальный индекс разрешает только один draft для каждого creator_id.
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

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt!: Date | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt!: Date | null;

  @Column({ name: 'creator_id', type: 'integer' })
  creatorId!: number;

  @Column({ name: 'moderator_id', type: 'integer', nullable: true })
  moderatorId!: number | null;

  @ManyToOne(() => User, user => user.insulationMaterials, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'creator_id', referencedColumnName: 'userId', foreignKeyConstraintName: 'fk_insulation_materials_creator' })
  creator!: User;

  @ManyToOne(() => User, user => user.moderatedInsulationMaterials, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'moderator_id', referencedColumnName: 'userId', foreignKeyConstraintName: 'fk_insulation_materials_moderator' })
  moderator!: User | null;

  @OneToMany(() => InsulationMaterialLike, like => like.insulationMaterial)
  likes!: InsulationMaterialLike[];

  // Заполняется COUNT-запросом loadRelationCountAndMap; массив лайков в шаблон не передаётся.
  insulationLikeCount?: number;
}
