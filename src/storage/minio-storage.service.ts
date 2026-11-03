import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { Client } from 'minio';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';

export interface UploadedMediaFile {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

@Injectable()
export class MinioStorageService {
  // ДЛЯ ЗАЩИТЫ: сами изображения и видео лежат в MinIO, а PostgreSQL хранит только имена объектов.
  private readonly bucket = process.env.MINIO_BUCKET || 'insulation-materials';
  private readonly publicUrl = (process.env.MINIO_PUBLIC_URL || 'http://localhost:9020').replace(/\/$/, '');
  private readonly client = new Client({
    endPoint: process.env.MINIO_ENDPOINT || '127.0.0.1',
    port: Number(process.env.MINIO_PORT || 9020),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ROOT_USER || 'teploshchit',
    secretKey: process.env.MINIO_ROOT_PASSWORD || 'change-me-please',
  });

  private initialized?: Promise<void>;

  private async initialize(): Promise<void> {
    // Bucket создаётся при первом обращении; политика разрешает клиенту читать загруженные файлы.
    try {
      if (!(await this.client.bucketExists(this.bucket))) await this.client.makeBucket(this.bucket);
      await this.client.setBucketPolicy(this.bucket, JSON.stringify({
        Version: '2012-10-17',
        Statement: [{ Effect: 'Allow', Principal: { AWS: ['*'] }, Action: ['s3:GetObject'], Resource: [`arn:aws:s3:::${this.bucket}/*`] }],
      }));
    } catch {
      throw new ServiceUnavailableException('MinIO недоступен');
    }
  }

  async upload(file: UploadedMediaFile, kind: 'image' | 'video'): Promise<string> {
    this.initialized ??= this.initialize();
    await this.initialized;
    const sourceExtension = extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, '');
    const mimeExtension = file.mimetype === 'image/jpeg' ? '.jpg'
      : file.mimetype === 'image/png' ? '.png'
        : file.mimetype === 'image/webp' ? '.webp'
          : file.mimetype === 'video/webm' ? '.webm' : '.mp4';
    const extension = sourceExtension || mimeExtension;
    // Имя генерируется на латинице: тип файла, время и UUID исключают совпадения.
    const objectName = `${kind}-${Date.now()}-${randomUUID()}${extension}`;
    try {
      await this.client.putObject(this.bucket, objectName, file.buffer, file.size, { 'Content-Type': file.mimetype });
      return objectName;
    } catch {
      throw new ServiceUnavailableException('Не удалось сохранить файл в MinIO');
    }
  }

  publicObjectUrl(objectName: string | null): string | null {
    // Сериализатор вызывает этот метод, чтобы превратить имя объекта в доступный HTTP URL.
    if (!objectName) return null;
    if (/^(https?:\/\/|\/)/.test(objectName)) return objectName;
    return `${this.publicUrl}/${this.bucket}/${encodeURIComponent(objectName)}`;
  }

  async remove(objectName: string | null): Promise<void> {
    if (!objectName || /^(https?:\/\/|\/)/.test(objectName)) return;
    try {
      await this.client.removeObject(this.bucket, objectName);
    } catch {
      // Очистка компенсирует ошибку БД и не должна скрывать исходную ошибку.
    }
  }
}
