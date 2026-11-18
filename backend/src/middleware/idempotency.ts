import { Response, NextFunction } from 'express';
import crypto from 'crypto';
import { AuthenticatedRequest } from '../types/index.js';
import { prisma } from '../services/prisma.js';
import { AppError } from './errorHandler.js';

export function idempotencyMiddleware(options?: { required?: boolean }) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const key = (req.headers['idempotency-key'] || req.headers['x-idempotency-key']) as string;

    if (!key) {
      if (options?.required) {
        throw new AppError('Idempotency-Key header is required for this operation', 400);
      }
      return next();
    }

    if (!req.shopId) {
      return next();
    }

    const payloadHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(req.body || {}))
      .digest('hex');

    req.idempotencyKey = key;

    try {
      const existing = await prisma.idempotencyKey.findUnique({
        where: {
          shop_id_key: {
            shop_id: req.shopId,
            key: key
          }
        }
      });

      if (existing) {
        if (existing.status === 'COMPLETED' && existing.response_body) {
          res.status(existing.response_status || 200).json(existing.response_body);
          return;
        }

        if (existing.status === 'IN_PROGRESS') {
          throw new AppError('Concurrent request with the same idempotency key is already in progress', 409);
        }
      }

      // Record key as IN_PROGRESS
      const expiry = new Date();
      expiry.setHours(expiry.getHours() + 24);

      await prisma.idempotencyKey.upsert({
        where: {
          shop_id_key: {
            shop_id: req.shopId,
            key: key
          }
        },
        update: {
          request_payload_hash: payloadHash,
          status: 'IN_PROGRESS',
          expires_at: expiry
        },
        create: {
          shop_id: req.shopId,
          key: key,
          request_path: req.originalUrl,
          request_payload_hash: payloadHash,
          status: 'IN_PROGRESS',
          expires_at: expiry
        }
      });

      // Hook res.json to cache response upon completion
      const originalJson = res.json.bind(res);
      res.json = (body: any) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          prisma.idempotencyKey
            .update({
              where: {
                shop_id_key: {
                  shop_id: req.shopId!,
                  key: key
                }
              },
              data: {
                status: 'COMPLETED',
                response_status: res.statusCode,
                response_body: body
              }
            })
            .catch((e) => console.error('Failed to update idempotency key cache', e));
        } else {
          prisma.idempotencyKey
            .delete({
              where: {
                shop_id_key: {
                  shop_id: req.shopId!,
                  key: key
                }
              }
            })
            .catch(() => {});
        }
        return originalJson(body);
      };

      next();
    } catch (err) {
      next(err);
    }
  };
}
