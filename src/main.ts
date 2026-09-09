import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import { readdirSync, readFileSync } from 'node:fs';
import hbs from 'hbs';
import { InsulationModule } from './insulation-materials/insulation.module';

export async function createInsulationApplication() {
  const app = await NestFactory.create<NestExpressApplication>(InsulationModule);
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');
  const insulationPartials = join(__dirname, '..', 'views', 'partials');
  for (const insulationPartial of readdirSync(insulationPartials)) {
    if (insulationPartial.endsWith('.hbs')) hbs.registerPartial(insulationPartial.slice(0, -4), readFileSync(join(insulationPartials, insulationPartial), 'utf8'));
  }
  app.useStaticAssets(join(__dirname, '..', 'public'), { prefix: '/insulation-assets/' });
  app.disable('x-powered-by');
  return app;
}

if (require.main === module) {
  createInsulationApplication().then(app => app.listen(Number(process.env.PORT || 3000), '127.0.0.1'));
}
