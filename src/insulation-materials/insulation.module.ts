import { Module } from '@nestjs/common';
import { InsulationController } from './insulation.controller';

@Module({ controllers: [InsulationController] })
export class InsulationModule {}
