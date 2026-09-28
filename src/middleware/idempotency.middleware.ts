import { Request, Response, NextFunction } from 'express';
import { BadRequestError } from '../errors/rfc7807.error';
import { validate as uuidValidate } from 'uuid';

interface CachedResponse {
  statusCode: number;
  body: any;
  etag: string;
  createdAt: number;
}

// Memory / Redis fallback cache for idempotency tokens (24h TTL)
const idempotencyStore = new Map<string, CachedResponse>();
const TTL_MS = 24 * 60 * 60 * 1000;

export function idempotencyMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.method !== 'POST') {
    return next();
  }

  const key = req.headers['x-idempotency-key'] as string;
  if (!key) {
    return next(new BadRequestError("Missing required 'X-Idempotency-Key' HTTP header in UUID format."));
  }

  if (!uuidValidate(key)) {
    return next(new BadRequestError("Invalid 'X-Idempotency-Key'. Header value must be a valid UUID v4 string."));
  }

  const existing = idempotencyStore.get(key);
  if (existing) {
    if (Date.now() - existing.createdAt < TTL_MS) {
      res.setHeader('ETag', existing.etag);
      res.setHeader('X-Cache-Lookup', 'HIT');
      res.status(200).json(existing.body);
      return;
    } else {
      idempotencyStore.delete(key);
    }
  }

  // Intercept response to store payload upon successful creation
  const originalJson = res.json.bind(res);
  res.json = (body: any) => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const etag = `W/"${key}-${Date.now()}"`;
      res.setHeader('ETag', etag);
      idempotencyStore.set(key, {
        statusCode: res.statusCode,
        body,
        etag,
        createdAt: Date.now()
      });
    }
    return originalJson(body);
  };

  next();
}

export function clearIdempotencyCache(): void {
  idempotencyStore.clear();
}
