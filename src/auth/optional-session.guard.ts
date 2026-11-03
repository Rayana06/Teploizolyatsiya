import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { SessionService } from '../session/session.service';
import { SessionRequest } from './authenticated-request';

@Injectable()
export class OptionalSessionGuard implements CanActivate {
  constructor(
    private readonly sessions: SessionService,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<SessionRequest>();
    const sessionId = request.cookies?.sessionId;
    if (typeof sessionId !== 'string' || !sessionId) return true;

    const userId = await this.sessions.getUserId(sessionId);
    if (userId === null) return true;
    const user = await this.users.findOneBy({ userId });
    if (!user) {
      await this.sessions.destroy(sessionId);
      return true;
    }

    request.sessionId = sessionId;
    request.currentUser = user;
    return true;
  }
}
