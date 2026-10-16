"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationQueue = exports.emailQueue = exports.smsQueue = void 0;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const connection = new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
});
const defaultJobOptions = {
    attempts: 3,
    backoff: {
        type: 'exponential',
        delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: false, // Failed jobs remain in the failed set (effectively a dead letter queue)
};
exports.smsQueue = new bullmq_1.Queue('smsQueue', { connection, defaultJobOptions });
exports.emailQueue = new bullmq_1.Queue('emailQueue', { connection, defaultJobOptions });
exports.notificationQueue = new bullmq_1.Queue('notificationQueue', { connection, defaultJobOptions });
