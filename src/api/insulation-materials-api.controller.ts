import { BadRequestException, Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Query, Req, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiCookieAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthenticatedRequest, SessionRequest } from '../auth/authenticated-request';
import { OptionalSessionGuard } from '../auth/optional-session.guard';
import { SessionGuard } from '../auth/session.guard';
import { UploadedMediaFile } from '../storage/minio-storage.service';
import { InsulationMaterialsApiService } from './insulation-materials-api.service';
import { CreateInsulationMaterialDto, SetLikeDto } from './dto/insulation-material.dto';

function mediaFileFilter(_request: unknown, file: UploadedMediaFile, callback: (error: Error | null, accept: boolean) => void) {
  const accepted = file.originalname === undefined
    || (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/'));
  callback(accepted ? null : new BadRequestException('Допустимы только файлы изображения и видео'), accepted);
}

@ApiTags('Теплоизоляционные материалы')
@Controller('api/insulation-materials')
export class InsulationMaterialsApiController {
  constructor(private readonly service: InsulationMaterialsApiService) {}

  // ДЛЯ ЗАЩИТЫ: контроллер принимает HTTP-запрос, извлекает параметры и передаёт работу сервису.
  // GET /api/insulation-materials — список только опубликованных услуг с фильтрами из query string.
  @Get()
  @UseGuards(OptionalSessionGuard)
  @ApiOperation({ summary: 'Получить все опубликованные услуги; доступно гостю' })
  @ApiQuery({ name: 'maxThicknessMm', required: false, type: Number, minimum: 1, maximum: 1000 })
  @ApiQuery({ name: 'insulationType', required: false, type: String, example: 'Минвата' })
  @ApiQuery({ name: 'search', required: false, type: String, example: 'Технолайт' })
  @ApiResponse({ status: 200, description: 'Список и количество услуг' })
  list(@Req() request: SessionRequest, @Query() query: Record<string, string | undefined>) {
    return this.service.list(query, request.currentUser?.userId);
  }

  // Это один GET-метод ленты с двумя допустимыми сценариями:
  // /feed начинает просмотр, /feed/:id?next=true выполняет «Далее».
  @Get(['feed', 'feed/:id'])
  @UseGuards(OptionalSessionGuard)
  @ApiOperation({ summary: 'Получить элемент ленты; доступно гостю' })
  @ApiParam({ name: 'id', required: false, description: 'ID текущей услуги для перехода к следующей' })
  @ApiQuery({ name: 'next', required: false, enum: ['true'], description: 'Используется только вместе с id' })
  @ApiResponse({ status: 200, description: 'Одна опубликованная услуга' })
  feed(@Req() request: SessionRequest, @Param('id') id?: string, @Query('next') next?: string) {
    return this.service.feed(id, next, request.currentUser?.userId);
  }

  // id не передаётся: черновик ищется по текущему пользователю из singleton-функции.
  @Get('draft')
  @UseGuards(SessionGuard)
  @ApiCookieAuth('sessionId')
  @ApiOperation({ summary: 'Получить свой черновик' })
  @ApiResponse({ status: 401, description: 'Нет действующей сессии' })
  draft(@Req() request: AuthenticatedRequest) {
    return this.service.draft(request.currentUser.userId);
  }

  // multipart/form-data позволяет принять обычные поля и настоящие файлы image/video.
  @Post()
  @UseGuards(SessionGuard)
  @ApiCookieAuth('sessionId')
  @ApiOperation({ summary: 'Создать черновик с изображением и видео' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateInsulationMaterialDto })
  @ApiResponse({ status: 201, description: 'Черновик создан; creatorId взят из сессии' })
  @ApiResponse({ status: 401, description: 'Нет действующей сессии' })
  @UseInterceptors(FileFieldsInterceptor(
    [{ name: 'image', maxCount: 1 }, { name: 'video', maxCount: 1 }],
    { limits: { fileSize: 20 * 1024 * 1024, files: 2 }, fileFilter: mediaFileFilter },
  ))
  create(
    @Req() request: AuthenticatedRequest,
    @Body() body: Record<string, string>,
    @UploadedFiles() files: { image?: UploadedMediaFile[]; video?: UploadedMediaFile[] } = {},
  ) {
    const image = files.image?.[0];
    const video = files.video?.[0];
    if (image && !image.mimetype.startsWith('image/')) throw new BadRequestException('Поле image должно содержать изображение');
    if (video && !video.mimetype.startsWith('video/')) throw new BadRequestException('Поле video должно содержать видео');
    return this.service.create(request.currentUser.userId, body, image, video);
  }

  // Отдельный метод смены статуса: черновик можно опубликовать, но вернуть назад нельзя.
  @Put(':id/publish')
  @UseGuards(SessionGuard)
  @ApiCookieAuth('sessionId')
  @ApiOperation({ summary: 'Опубликовать свой черновик' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ schema: { type: 'object', additionalProperties: false } })
  @ApiResponse({ status: 200, description: 'Статус изменён на published, заполнен publishedAt' })
  @ApiResponse({ status: 401, description: 'Гость не аутентифицирован' })
  @ApiResponse({ status: 403, description: 'Черновик принадлежит другому пользователю' })
  publish(@Req() request: AuthenticatedRequest, @Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.service.publish(request.currentUser.userId, id, body || {});
  }

  // Удаление логическое: запись остаётся в БД со статусом deleted.
  @Delete(':id')
  @HttpCode(204)
  @UseGuards(SessionGuard)
  @ApiCookieAuth('sessionId')
  @ApiOperation({ summary: 'Логически удалить свою услугу' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204, description: 'Статус изменён на deleted' })
  @ApiResponse({ status: 401, description: 'Нет действующей сессии' })
  @ApiResponse({ status: 403, description: 'Услуга принадлежит другому пользователю' })
  async softDelete(@Req() request: AuthenticatedRequest, @Param('id') id: string): Promise<void> {
    await this.service.softDelete(request.currentUser.userId, id);
  }

  // liked=1 ставит лайк, liked=0 отменяет его.
  @Post(':id/like')
  @UseGuards(SessionGuard)
  @ApiCookieAuth('sessionId')
  @ApiOperation({ summary: 'Поставить или снять лайк' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: SetLikeDto })
  @ApiResponse({ status: 201, description: 'Новое состояние лайка и их количество' })
  @ApiResponse({ status: 401, description: 'Нет действующей сессии' })
  setLike(@Req() request: AuthenticatedRequest, @Param('id') id: string, @Body() body: SetLikeDto) {
    return this.service.setLike(request.currentUser.userId, id, body.liked);
  }
}
