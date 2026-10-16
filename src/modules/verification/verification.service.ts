import { prisma } from '../../database/prisma.service';
import { redis } from '../../config/redis';
import { AppError } from '../../common/errors';
import { OrderVerificationType, OrderVerificationStatus, OrderStatus } from '@prisma/client';

export class VerificationService {
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async createVerification(orderId: string, type: OrderVerificationType): Promise<{ verificationId: string; otp?: string }> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true }
    });

    if (!order) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }

    if (order.status !== OrderStatus.VERIFICATION_REQUIRED) {
      throw new AppError('Order does not require verification', 400, 'VERIFICATION_NOT_REQUIRED');
    }

    // Check for existing pending verification
    let verification = await prisma.orderVerification.findFirst({
      where: { orderId, status: OrderVerificationStatus.PENDING }
    });

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    if (!verification) {
      verification = await prisma.orderVerification.create({
        data: {
          orderId,
          type,
          expiresAt,
          status: OrderVerificationStatus.PENDING,
          attempts: 0
        }
      });
    } else {
      // Check cooldown
      const cooldownKey = `kiddybd:otp:order:${orderId}:cooldown`;
      const onCooldown = await redis.get(cooldownKey);
      if (onCooldown) {
        throw new AppError('Please wait before requesting another OTP', 429, 'RATE_LIMIT_EXCEEDED');
      }

      // Update expiry and type
      verification = await prisma.orderVerification.update({
        where: { id: verification.id },
        data: {
          type,
          expiresAt,
          attempts: 0 // Reset attempts on resend
        }
      });
    }

    const otp = this.generateOTP();
    const key = `kiddybd:otp:order:${orderId}`;
    const cooldownKey = `${key}:cooldown`;

    // Store OTP in redis
    await redis.set(key, otp, 'EX', 300); // 5 minutes
    await redis.set(cooldownKey, '1', 'EX', 60); // 60s cooldown

    // Note: In production, send OTP via SMS/Email to order.customer.phone
    // For tests/development, we return the OTP if needed or we could mock the SMS service

    return { verificationId: verification.id, otp }; // Returning OTP for ease of testing
  }

  async verifyOrder(orderId: string, userId: string, submittedOtp: string): Promise<void> {
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }

    if (order.customerId !== userId) {
      throw new AppError('Unauthorized', 403, 'UNAUTHORIZED');
    }

    if (order.status !== OrderStatus.VERIFICATION_REQUIRED) {
      throw new AppError('Order is not in verification state', 400, 'INVALID_ORDER_STATE');
    }

    const verification = await prisma.orderVerification.findFirst({
      where: { orderId, status: OrderVerificationStatus.PENDING },
      orderBy: { createdAt: 'desc' }
    });

    if (!verification) {
      throw new AppError('No pending verification found', 404, 'VERIFICATION_NOT_FOUND');
    }

    if (verification.expiresAt < new Date()) {
      await prisma.orderVerification.update({
        where: { id: verification.id },
        data: { status: OrderVerificationStatus.EXPIRED }
      });
      throw new AppError('Verification expired', 400, 'VERIFICATION_EXPIRED');
    }

    if (verification.attempts >= 5) {
      await prisma.orderVerification.update({
        where: { id: verification.id },
        data: { status: OrderVerificationStatus.FAILED }
      });
      throw new AppError('Maximum attempts reached. Please request a new OTP', 429, 'MAX_ATTEMPTS_REACHED');
    }

    // Increment attempts
    await prisma.orderVerification.update({
      where: { id: verification.id },
      data: { attempts: { increment: 1 } }
    });

    const key = `kiddybd:otp:order:${orderId}`;
    const storedOtp = await redis.get(key);

    if (!storedOtp || storedOtp !== submittedOtp) {
      throw new AppError('Invalid OTP', 400, 'INVALID_OTP');
    }

    // Success: Execute transaction
    await prisma.$transaction(async (tx) => {
      // Mark verification as verified
      await tx.orderVerification.update({
        where: { id: verification.id },
        data: {
          status: OrderVerificationStatus.VERIFIED,
          verifiedAt: new Date()
        }
      });

      // Update order status to CONFIRMED
      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CONFIRMED }
      });

      // Add order history
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: OrderStatus.VERIFICATION_REQUIRED,
          toStatus: OrderStatus.CONFIRMED,
          reason: 'OTP Verified successfully',
          changedBy: userId
        }
      });
    });

    // Cleanup Redis
    await redis.del(key);
    await redis.del(`${key}:cooldown`);
  }
}

export const verificationService = new VerificationService();
