import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { InsulationMaterial } from './insulation-materials.entity';
import { InsulationMaterialLike } from './insulation-materials-like.entity';

// ДЛЯ ЗАЩИТЫ: ORM-модель таблицы users и её связей с услугами и лайками.
@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn({ name: 'user_id', type: 'integer' })
  userId!: number;

  @Column({ name: 'email', type: 'varchar', length: 254, unique: true })
  email!: string;

  @Column({ name: 'display_name', type: 'varchar', length: 100 })
  displayName!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash!: string;

  @OneToMany(() => InsulationMaterial, material => material.creator)
  insulationMaterials!: InsulationMaterial[];

  @OneToMany(() => InsulationMaterial, material => material.moderator)
  moderatedInsulationMaterials!: InsulationMaterial[];

  @OneToMany(() => InsulationMaterialLike, like => like.user)
  insulationMaterialLikes!: InsulationMaterialLike[];
}
