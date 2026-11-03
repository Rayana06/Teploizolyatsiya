import { User } from '../database/entities/user.entity';

export class UserSerializer {
  serialize(user: User) {
    // ДЛЯ ЗАЩИТЫ: passwordHash намеренно отсутствует в ответе API.
    return {
      id: user.userId,
      email: user.email,
      displayName: user.displayName,
    };
  }
}
