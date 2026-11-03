import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import { readdirSync, readFileSync } from 'node:fs';
import hbs from 'hbs';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { InsulationMaterialsModule } from './insulation-materials/insulation-materials.module';

export async function createInsulationApplication() {
  const app = await NestFactory.create<NestExpressApplication>(InsulationMaterialsModule);
  app.use(cookieParser());
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');
  const insulationPartials = join(__dirname, '..', 'views', 'partials');
  for (const insulationPartial of readdirSync(insulationPartials)) {
    if (insulationPartial.endsWith('.hbs')) hbs.registerPartial(insulationPartial.slice(0, -4), readFileSync(join(insulationPartials, insulationPartial), 'utf8'));
  }
  app.useStaticAssets(join(__dirname, '..', 'public'), { prefix: '/insulation-materials-assets/' });
  app.disable('x-powered-by');

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Теплощит — API лабораторной работы №4')
    .setDescription([
      'Сессионная аутентификация через cookie `sessionId` и Redis.',
      'Сначала выполните `POST /api/users/authenticate`: Swagger UI получит cookie и будет отправлять её автоматически.',
      'Без сессии доступны публичные GET-методы списка и ленты.',
    ].join('\n\n'))
    .setVersion('4.0')
    .addCookieAuth('sessionId', { type: 'apiKey', in: 'cookie' }, 'sessionId')
    .build();
  SwaggerModule.setup('swagger', app, SwaggerModule.createDocument(app, swaggerConfig), {
    swaggerOptions: { withCredentials: true },
  });
  return app;
}

if (require.main === module) {
  createInsulationApplication().then(app => app.listen(Number(process.env.PORT || 3001), '127.0.0.1'));
}
