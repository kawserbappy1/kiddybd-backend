"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cronQueue = void 0;
exports.setupCronJobs = setupCronJobs;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const connection = new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379');
exports.cronQueue = new bullmq_1.Queue('cron-jobs', {
    connection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: false
    }
});
// Setup scheduled jobs
async function setupCronJobs() {
    // Inventory expiration (every 5 min)
    await exports.cronQueue.upsertJobScheduler('expireInventory', { pattern: '*/5 * * * *' });
    // Cancel unpaid orders (every 30 min)
    await exports.cronQueue.upsertJobScheduler('cancelUnpaidOrders', { pattern: '*/30 * * * *' });
    // Sync shipments (every 1 hr)
    await exports.cronQueue.upsertJobScheduler('syncShipments', { pattern: '0 * * * *' });
    // Payment reconciliation (every 1 hr)
    await exports.cronQueue.upsertJobScheduler('reconcilePayments', { pattern: '30 * * * *' }); // offset by 30m
    // Analytics aggregation (every day at midnight)
    await exports.cronQueue.upsertJobScheduler('aggregateAnalytics', { pattern: '0 0 * * *' });
}
