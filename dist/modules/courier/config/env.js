"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const zod_1 = require("zod");
const dotenv_1 = require("dotenv");
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.string().default('3000'),
    DATABASE_URL: zod_1.z.string(),
    REDIS_URL: zod_1.z.string(),
    JWT_ACCESS_SECRET: zod_1.z.string(),
    JWT_REFRESH_SECRET: zod_1.z.string(),
    CORS_ORIGINS: zod_1.z.string(),
    GOOGLE_CLIENT_ID: zod_1.z.string(),
    GOOGLE_CLIENT_SECRET: zod_1.z.string(),
    GOOGLE_CALLBACK_URL: zod_1.z.string(),
    CLOUDINARY_CLOUD_NAME: zod_1.z.string().optional(),
    CLOUDINARY_API_KEY: zod_1.z.string().optional(),
    CLOUDINARY_API_SECRET: zod_1.z.string().optional(),
    SMS_GATEWAY_URL: zod_1.z.string().optional(),
    SMS_GATEWAY_API_KEY: zod_1.z.string().optional(),
    SMTP_HOST: zod_1.z.string().optional().default('smtp.gmail.com'),
    SMTP_PORT: zod_1.z.string().optional().default('465'),
    SMTP_USER: zod_1.z.string().optional(),
    SMTP_PASS: zod_1.z.string().optional(),
    SMTP_FROM: zod_1.z.string().optional().default('KiddyBD <no-reply@kiddybd.com>'),
});
const _env = envSchema.safeParse(process.env);
if (!_env.success) {
    if (process.env.NODE_ENV !== 'test') {
        console.error('❌ Invalid environment variables:', _env.error.format());
        process.exit(1);
    }
}
exports.env = _env.success ? _env.data : process.env;
