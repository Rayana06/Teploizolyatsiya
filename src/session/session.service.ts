import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class SessionService implements OnModuleDestroy {
  private readonly redis = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT || 6379),
    lazyConnect: true,
    maxRetriesPerRequest: 1,
  });

  private readonly ttlSeconds = Number(process.env.SESSION_TTL_SECONDS || 3600);

  private key(sessionId: string): string {
    return `session:${sessionId}`;
  }

  async create(sessionId: string, userId: number): Promise<void> {
    await this.redis.set(this.key(sessionId), String(userId), 'EX', this.ttlSeconds);
  }

  async getUserId(sessionId: string): Promise<number | null> {
    const value = await this.redis.get(this.key(sessionId));
    if (value === null) return null;
    const userId = Number(value);
    return Number.isInteger(userId) && userId > 0 ? userId : null;
  }

  async destroy(sessionId: string): Promise<void> {
    await this.redis.del(this.key(sessionId));
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redis.status !== 'end') await this.redis.quit();
  }
}
