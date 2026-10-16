import winston from 'winston';
import { env } from './env';

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

export const logger = winston.createLogger({
  level: env.NODE_ENV === 'development' ? 'debug' : 'info',
  format,
  defaultMeta: { service: 'kiddybd-api' },
  transports: [
    new winston.transports.Console({
      format: env.NODE_ENV === 'development'
        ? winston.format.combine(winston.format.colorize(), winston.format.simple())
        : format
    })
  ]
});
