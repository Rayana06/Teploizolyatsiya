import { Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { InsulationMaterial } from './insulation-materials.entity';
import { User } from './user.entity';

// ДЛЯ ЗАЩИТЫ: отдельная связующая таблица хранит пары «пользователь — услуга».
@Entity({ name: 'insulation_material_likes' })
// Уникальный индекс запрещает повторный лайк той же услуги тем же пользователем.
@Index('uq_insulation_material_likes_user_material', ['user', 'insulationMaterial'], { unique: true })
export class InsulationMaterialLike {
  @PrimaryGeneratedColumn({ name: 'insulation_material_like_id', type: 'integer' })
  insulationMaterialLikeId!: number;

  @ManyToOne(() => User, user => user.insulationMaterialLikes, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'userId', foreignKeyConstraintName: 'fk_insulation_material_likes_user' })
  user!: User;

  @ManyToOne(() => InsulationMaterial, material => material.likes, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'insulation_material_id', referencedColumnName: 'insulationMaterialId', foreignKeyConstraintName: 'fk_insulation_material_likes_material' })
  insulationMaterial!: InsulationMaterial;
}
