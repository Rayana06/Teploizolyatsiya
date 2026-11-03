import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { SessionService } from '../session/session.service';
import { AuthenticatedRequest } from './authenticated-request';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly sessions: SessionService,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const sessionId = request.cookies?.sessionId;
    if (typeof sessionId !== 'string' || !sessionId) {
      throw new UnauthorizedException('Требуется аутентификация');
    }

    const userId = await this.sessions.getUserId(sessionId);
    if (userId === null) {
      throw new UnauthorizedException('Сессия отсутствует или истекла');
    }

    const user = await this.users.findOneBy({ userId });
    if (!user) {
      await this.sessions.destroy(sessionId);
      throw new UnauthorizedException('Пользователь сессии не найден');
    }

    request.sessionId = sessionId;
    request.currentUser = user;
    return true;
  }
}
