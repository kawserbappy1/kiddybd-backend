"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../config/logger");
class PrismaService extends client_1.PrismaClient {
    constructor() {
        super({
            log: [
                { emit: 'event', level: 'query' },
                { emit: 'event', level: 'error' },
                { emit: 'event', level: 'info' },
                { emit: 'event', level: 'warn' },
            ],
        });
        this.$on('error', (e) => {
            logger_1.logger.error('Prisma Error', { message: e.message, target: e.target });
        });
    }
    async connect() {
        try {
            await this.$connect();
            logger_1.logger.info('Successfully connected to the database.');
        }
        catch (error) {
            logger_1.logger.error('Database connection failed:', error);
            process.exit(1);
        }
    }
    async enableShutdownHooks() {
        process.on('beforeExit', async () => {
            await this.$disconnect();
            logger_1.logger.info('Database connection closed due to application exit.');
        });
        process.on('SIGINT', async () => {
            await this.$disconnect();
            logger_1.logger.info('Database connection closed due to SIGINT.');
            process.exit(0);
        });
        process.on('SIGTERM', async () => {
            await this.$disconnect();
            logger_1.logger.info('Database connection closed due to SIGTERM.');
            process.exit(0);
        });
    }
}
const prisma = new PrismaService();
exports.prisma = prisma;
