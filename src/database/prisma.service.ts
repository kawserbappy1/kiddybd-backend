import { PrismaClient } from '@prisma/client';
import { logger } from '../config/logger';

class PrismaService extends PrismaClient {
  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
      ],
    });

    (this as any).$on('error', (e: any) => {
      logger.error('Prisma Error', { message: e.message, target: e.target });
    });
  }

  async connect() {
    try {
      await this.$connect();
      logger.info('Successfully connected to the database.');
    } catch (error) {
      logger.error('Database connection failed:', error);
      process.exit(1);
    }
  }

  async enableShutdownHooks() {
    process.on('beforeExit', async () => {
      await this.$disconnect();
      logger.info('Database connection closed due to application exit.');
    });

    process.on('SIGINT', async () => {
      await this.$disconnect();
      logger.info('Database connection closed due to SIGINT.');
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await this.$disconnect();
      logger.info('Database connection closed due to SIGTERM.');
      process.exit(0);
    });
  }
}

const prisma = new PrismaService();

export { prisma };
