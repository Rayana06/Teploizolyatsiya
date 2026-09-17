import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InsulationMaterialLike } from '../database/entities/insulation-material-like.entity';
import { InsulationMaterial } from '../database/entities/insulation-material.entity';
import { User } from '../database/entities/user.entity';
import { CreateLab2Schema1757900000000 } from '../database/migrations/1757900000000-create-lab2-schema';
import { InsulationController } from './insulation.controller';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST || '127.0.0.1',
      port: Number(process.env.POSTGRES_PORT || 5433),
      username: process.env.POSTGRES_USER || 'teploshchit',
      password: process.env.POSTGRES_PASSWORD || 'teploshchit',
      database: process.env.POSTGRES_DB || 'teploshchit',
      entities: [User, InsulationMaterial, InsulationMaterialLike],
      migrations: [CreateLab2Schema1757900000000],
      migrationsRun: true,
      synchronize: false,
      logging: process.env.TYPEORM_LOGGING === 'true',
    }),
    TypeOrmModule.forFeature([InsulationMaterial]),
  ],
  controllers: [InsulationController],
})
export class InsulationModule {}
