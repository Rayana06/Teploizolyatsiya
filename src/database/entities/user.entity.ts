import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { InsulationMaterial } from './insulation-material.entity';
import { InsulationMaterialLike } from './insulation-material-like.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn({ name: 'user_id', type: 'integer' })
  userId!: number;

  @Column({ name: 'email', type: 'varchar', length: 254, unique: true })
  email!: string;

  @Column({ name: 'display_name', type: 'varchar', length: 100 })
  displayName!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @OneToMany(() => InsulationMaterial, material => material.creator)
  insulationMaterials!: InsulationMaterial[];

  @OneToMany(() => InsulationMaterialLike, like => like.user)
  insulationMaterialLikes!: InsulationMaterialLike[];
}
