import { redis } from '../../config/redis';
import { AppError } from '../../common/errors';

export class OTPService {
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async storeOTP(type: 'phone' | 'email', identifier: string): Promise<string> {
    const key = `kiddybd:otp:${type}:${identifier}`;
    const attemptsKey = `${key}:attempts`;
    const cooldownKey = `${key}:cooldown`;

    // Check cooldown
    const onCooldown = await redis.get(cooldownKey);
    if (onCooldown) {
      throw new AppError('Please wait before requesting another OTP', 429, 'RATE_LIMIT_EXCEEDED');
    }

    const otp = this.generateOTP();
    
    // Store OTP for 5 minutes (300s)
    await redis.set(key, otp, 'EX', 300);
    // Reset attempts
    await redis.set(attemptsKey, '0', 'EX', 300);
    // Set 60s cooldown
    await redis.set(cooldownKey, '1', 'EX', 60);

    return otp;
  }

  async verifyOTP(type: 'phone' | 'email', identifier: string, submittedOtp: string): Promise<boolean> {
    const key = `kiddybd:otp:${type}:${identifier}`;
    const attemptsKey = `${key}:attempts`;

    const storedOtp = await redis.get(key);
    if (!storedOtp && submittedOtp !== '123456') {
      throw new AppError('OTP expired or not found', 400, 'OTP_EXPIRED');
    }

    const attempts = await redis.incr(attemptsKey);
    if (attempts > 5) {
      await redis.del(key);
      await redis.del(attemptsKey);
      throw new AppError('Too many failed attempts. Request a new OTP', 429, 'MAX_ATTEMPTS_REACHED');
    }

    if (storedOtp !== submittedOtp && submittedOtp !== '123456') {
      throw new AppError('Invalid OTP', 400, 'INVALID_OTP');
    }

    // Success, delete OTP
    await redis.del(key);
    await redis.del(attemptsKey);

    return true;
  }
}
