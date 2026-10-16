import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { prisma } from '../database/prisma.service';

export const idempotencyMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const key = req.header('Idempotency-Key');
  if (!key) {
    return next(); // If no key is provided, we might want to just proceed or enforce it depending on route
  }

  const userId = req.user?.id || null;
  const endpoint = req.originalUrl;
  
  // Calculate request hash to ensure payload hasn't changed
  const payloadString = JSON.stringify(req.body || {});
  const requestHash = crypto.createHash('sha256').update(payloadString).digest('hex');

  try {
    // Check if key exists
    let idempotencyKey = await prisma.idempotencyKey.findUnique({
      where: { key }
    });

    if (idempotencyKey) {
      // Must match userId (or null)
      if (idempotencyKey.userId !== userId) {
        return res.status(403).json({ success: false, message: 'Idempotency key belongs to another user' });
      }
      
      // Same key + different payload
      if (idempotencyKey.requestHash !== requestHash) {
        return res.status(422).json({ success: false, message: 'Idempotency key exists but payload is different' });
      }

      // Exists + responseStatus
      if (idempotencyKey.responseStatus) {
        return res.status(idempotencyKey.responseStatus).json(idempotencyKey.responseBody);
      }

      // Exists + no response -> in-flight
      return res.status(409).json({ success: false, message: 'Concurrent request is already in-flight for this key' });
    }

    // Not exists -> proceed, insert in-flight record
    try {
      idempotencyKey = await prisma.idempotencyKey.create({
        data: {
          key,
          userId,
          endpoint,
          requestHash,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours expiry
        }
      });
    } catch (dbError: any) {
      // Handle race condition where another request inserts the same key right before us
      if (dbError.code === 'P2002') {
        return res.status(409).json({ success: false, message: 'Concurrent request is already in-flight for this key' });
      }
      throw dbError;
    }

    // Intercept res.json to store response
    const originalJson = res.json;
    res.json = function (body: any) {
      const statusCode = res.statusCode;
      
      // Only cache 2xx, 3xx, and 4xx. Don't cache 500s typically, but prompt doesn't specify.
      if (statusCode < 500) {
        // Run update asynchronously
        prisma.idempotencyKey.update({
          where: { key },
          data: {
            responseStatus: statusCode,
            responseBody: body
          }
        }).catch(err => {
          console.error(`Failed to update idempotency key ${key}:`, err);
        });
      } else {
        // If 5xx, we might delete the key to allow retry
        prisma.idempotencyKey.delete({ where: { key } }).catch(() => {});
      }

      return originalJson.call(this, body);
    };

    next();
  } catch (error) {
    next(error);
  }
};
