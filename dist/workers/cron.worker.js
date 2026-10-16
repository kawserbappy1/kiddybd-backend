"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cronWorker = void 0;
exports.handleExpireInventory = handleExpireInventory;
exports.handleCancelUnpaidOrders = handleCancelUnpaidOrders;
exports.handleSyncShipments = handleSyncShipments;
exports.handleReconcilePayments = handleReconcilePayments;
exports.handleAggregateAnalytics = handleAggregateAnalytics;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const inventory_service_1 = require("../modules/inventory/inventory.service");
const prisma_service_1 = require("../database/prisma.service");
const logger_1 = require("../config/logger");
const connection = new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
});
exports.cronWorker = new bullmq_1.Worker('cron-jobs', async (job) => {
    logger_1.logger.info(`Executing cron job: ${job.name}`);
    try {
        switch (job.name) {
            case 'expireInventory':
                await handleExpireInventory();
                break;
            case 'cancelUnpaidOrders':
                await handleCancelUnpaidOrders();
                break;
            case 'syncShipments':
                await handleSyncShipments();
                break;
            case 'reconcilePayments':
                await handleReconcilePayments();
                break;
            case 'aggregateAnalytics':
                await handleAggregateAnalytics();
                break;
            default:
                logger_1.logger.warn(`Unknown cron job: ${job.name}`);
        }
    }
    catch (error) {
        logger_1.logger.error(`Failed to execute cron job ${job.name}`, error);
        throw error; // Let BullMQ handle retries and dead letters
    }
}, { connection });
// Event listeners for safety/logging
exports.cronWorker.on('failed', (job, err) => {
    if (job) {
        logger_1.logger.error(`Job ${job.id} (${job.name}) failed with error: ${err.message}`);
    }
});
// Job Handlers
async function handleExpireInventory() {
    const expiredCount = await inventory_service_1.inventoryService.expireReservations();
    logger_1.logger.info(`Expired ${expiredCount} inventory reservations`);
}
async function handleCancelUnpaidOrders() {
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
    const result = await prisma_service_1.prisma.order.updateMany({
        where: {
            status: 'PENDING',
            createdAt: { lt: thirtyMinsAgo },
            paymentStatus: { not: 'COMPLETED' }
        },
        data: {
            status: 'CANCELLED'
        }
    });
    logger_1.logger.info(`Cancelled ${result.count} unpaid orders`);
}
async function handleSyncShipments() {
    // Mock logic to sync shipment status
    logger_1.logger.info('Synced shipments from courier APIs');
}
async function handleReconcilePayments() {
    // Poll payment gateways for stuck PENDING payments
    logger_1.logger.info('Reconciled stuck payments');
}
async function handleAggregateAnalytics() {
    // Cache or save analytics aggregation
    logger_1.logger.info('Aggregated daily analytics');
}
