import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InsulationMaterialLike } from '../database/entities/insulation-materials-like.entity';
import { InsulationMaterial } from '../database/entities/insulation-materials.entity';
import { User } from '../database/entities/user.entity';
import { AlignLab2Review1759200000000 } from '../database/migrations/1759200000000-align-lab2-review';
import { CreateLab2Schema1757900000000 } from '../database/migrations/1757900000000-create-lab2-schema';
import { AddLab3SystemFields1760000000000 } from '../database/migrations/1760000000000-add-lab3-system-fields';
import { InsulationMaterialsController } from './insulation-materials.controller';
import { InsulationMaterialsApiController } from '../api/insulation-materials-api.controller';
import { InsulationMaterialsApiService } from '../api/insulation-materials-api.service';
import { UsersApiController } from '../api/users-api.controller';
import { MinioStorageService } from '../storage/minio-storage.service';
import { SessionModule } from '../session/session.module';
import { SessionGuard } from '../auth/session.guard';
import { OptionalSessionGuard } from '../auth/optional-session.guard';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST || '127.0.0.1',
      port: Number(process.env.POSTGRES_PORT || 5434),
      username: process.env.POSTGRES_USER || 'teploshchit',
      password: process.env.POSTGRES_PASSWORD || 'teploshchit',
      database: process.env.POSTGRES_DB || 'teploshchit',
      entities: [User, InsulationMaterial, InsulationMaterialLike],
      migrations: [CreateLab2Schema1757900000000, AlignLab2Review1759200000000, AddLab3SystemFields1760000000000],
      migrationsRun: true,
      synchronize: false,
      logging: process.env.TYPEORM_LOGGING === 'true',
    }),
    TypeOrmModule.forFeature([User, InsulationMaterial, InsulationMaterialLike]),
    SessionModule,
  ],
  controllers: [InsulationMaterialsController, InsulationMaterialsApiController, UsersApiController],
  providers: [InsulationMaterialsApiService, MinioStorageService, SessionGuard, OptionalSessionGuard],
})
export class InsulationMaterialsModule {}
