import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  JWT_ACCESS_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  CORS_ORIGINS: z.string(),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_CALLBACK_URL: z.string(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  SMS_GATEWAY_URL: z.string().optional(),
  SMS_GATEWAY_API_KEY: z.string().optional(),
  SMTP_HOST: z.string().optional().default('smtp.gmail.com'),
  SMTP_PORT: z.string().optional().default('465'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional().default('KiddyBD <no-reply@kiddybd.com>'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  if (process.env.NODE_ENV !== 'test') {
    console.error('❌ Invalid environment variables:', _env.error.format());
    process.exit(1);
  }
}

export const env = _env.success ? _env.data : process.env as any;
