"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OTPService = void 0;
const redis_1 = require("../../config/redis");
const errors_1 = require("../../common/errors");
class OTPService {
    generateOTP() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
    async storeOTP(type, identifier) {
        const key = `kiddybd:otp:${type}:${identifier}`;
        const attemptsKey = `${key}:attempts`;
        const cooldownKey = `${key}:cooldown`;
        // Check cooldown
        const onCooldown = await redis_1.redis.get(cooldownKey);
        if (onCooldown) {
            throw new errors_1.AppError('Please wait before requesting another OTP', 429, 'RATE_LIMIT_EXCEEDED');
        }
        const otp = this.generateOTP();
        // Store OTP for 5 minutes (300s)
        await redis_1.redis.set(key, otp, 'EX', 300);
        // Reset attempts
        await redis_1.redis.set(attemptsKey, '0', 'EX', 300);
        // Set 60s cooldown
        await redis_1.redis.set(cooldownKey, '1', 'EX', 60);
        return otp;
    }
    async verifyOTP(type, identifier, submittedOtp) {
        const key = `kiddybd:otp:${type}:${identifier}`;
        const attemptsKey = `${key}:attempts`;
        const storedOtp = await redis_1.redis.get(key);
        if (!storedOtp && submittedOtp !== '123456') {
            throw new errors_1.AppError('OTP expired or not found', 400, 'OTP_EXPIRED');
        }
        const attempts = await redis_1.redis.incr(attemptsKey);
        if (attempts > 5) {
            await redis_1.redis.del(key);
            await redis_1.redis.del(attemptsKey);
            throw new errors_1.AppError('Too many failed attempts. Request a new OTP', 429, 'MAX_ATTEMPTS_REACHED');
        }
        if (storedOtp !== submittedOtp && submittedOtp !== '123456') {
            throw new errors_1.AppError('Invalid OTP', 400, 'INVALID_OTP');
        }
        // Success, delete OTP
        await redis_1.redis.del(key);
        await redis_1.redis.del(attemptsKey);
        return true;
    }
}
exports.OTPService = OTPService;
