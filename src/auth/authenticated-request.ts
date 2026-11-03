import { Request } from 'express';
import { User } from '../database/entities/user.entity';

export interface SessionRequest extends Request {
  sessionId?: string;
  currentUser?: User;
}

export interface AuthenticatedRequest extends SessionRequest {
  sessionId: string;
  currentUser: User;
}
