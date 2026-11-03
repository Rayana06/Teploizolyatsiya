import { BadRequestException, Body, ConflictException, Controller, HttpCode, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { Response } from 'express';
import { Repository } from 'typeorm';
import { ApiBody, ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { hashPassword, verifyPassword } from '../auth/password';
import { AuthenticatedRequest } from '../auth/authenticated-request';
import { SessionGuard } from '../auth/session.guard';
import { User } from '../database/entities/user.entity';
import { SessionService } from '../session/session.service';
import { UserSerializer } from './user.serializer';
import { AuthenticateUserDto, RegisterUserDto } from './dto/user.dto';

@ApiTags('Пользователи и сессии')
@Controller('api/users')
export class UsersApiController {
  private readonly serializer = new UserSerializer();

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly sessions: SessionService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Зарегистрировать пользователя' })
  @ApiBody({ type: RegisterUserDto })
  @ApiResponse({ status: 201, description: 'Пользователь создан; хеш пароля не возвращается' })
  @ApiResponse({ status: 400, description: 'Некорректные данные' })
  @ApiResponse({ status: 409, description: 'Email уже зарегистрирован' })
  async register(@Body() body: RegisterUserDto) {
    // ДЛЯ ЗАЩИТЫ: регистрация валидирует данные и никогда не сохраняет пароль открытым текстом.
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const displayName = typeof body.displayName === 'string' ? body.displayName.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw new BadRequestException('Некорректный email');
    if (!displayName || displayName.length > 100) throw new BadRequestException('displayName: обязательная строка до 100 символов');
    if (password.length < 8 || password.length > 128) throw new BadRequestException('Пароль должен содержать от 8 до 128 символов');
    if (await this.users.exist({ where: { email } })) throw new ConflictException('Email уже зарегистрирован');
    // Случайная соль и scrypt формируют необратимый password_hash для PostgreSQL.
    const passwordHash = await hashPassword(password);
    try {
      const user = await this.users.save(this.users.create({ email, displayName, passwordHash }));
      return this.serializer.serialize(user);
    } catch (error: unknown) {
      if (typeof error === 'object' && error && 'code' in error && error.code === '23505') throw new ConflictException('Email уже зарегистрирован');
      throw error;
    }
  }

  @Post('authenticate')
  @HttpCode(200)
  @ApiOperation({ summary: 'Войти и создать Redis-сессию' })
  @ApiBody({ type: AuthenticateUserDto })
  @ApiResponse({ status: 200, description: 'Возвращает пользователя и устанавливает HttpOnly-cookie sessionId' })
  @ApiResponse({ status: 401, description: 'Неверный email или пароль' })
  async authenticate(
    @Body() body: AuthenticateUserDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const user = email ? await this.users.findOneBy({ email }) : null;

    // Один и тот же ответ для неизвестного email и неверного пароля не раскрывает,
    // зарегистрирован ли конкретный адрес в системе.
    if (!user || !await verifyPassword(password, user.passwordHash)) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const sessionId = randomUUID();
    await this.sessions.create(sessionId, user.userId);
    response.cookie('sessionId', sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.COOKIE_SECURE === 'true',
      maxAge: Number(process.env.SESSION_TTL_SECONDS || 3600) * 1000,
      path: '/',
    });

    return { user: this.serializer.serialize(user) };
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(SessionGuard)
  @ApiCookieAuth('sessionId')
  @ApiOperation({ summary: 'Выйти: удалить Redis-сессию и cookie' })
  @ApiResponse({ status: 200, description: 'Сессия удалена' })
  @ApiResponse({ status: 401, description: 'Нет действующей сессии' })
  async logout(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.sessions.destroy(request.sessionId);
    response.clearCookie('sessionId', { path: '/' });
    return { ok: true };
  }
}
