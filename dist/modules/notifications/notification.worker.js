"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailWorker = exports.smsWorker = void 0;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const prisma_service_1 = require("../../database/prisma.service");
const connection = new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
});
exports.smsWorker = new bullmq_1.Worker('smsQueue', async (job) => {
    const { notificationId } = job.data;
    const notification = await prisma_service_1.prisma.notification.findUnique({
        where: { id: notificationId },
        include: { user: true }
    });
    if (!notification)
        return;
    try {
        // Simulated SMS Provider Call
        // console.log(`Sending SMS to ${notification.user.phone}: ${notification.body}`);
        // Check if we should simulate a failure based on metadata for testing purposes
        const metadata = notification.metadata;
        if (metadata && metadata.simulateFailure) {
            throw new Error('Simulated failure');
        }
        await prisma_service_1.prisma.notification.update({
            where: { id: notificationId },
            data: { status: 'SENT', sentAt: new Date() }
        });
    }
    catch (error) {
        // We do NOT update to FAILED immediately on error if we rely on BullMQ retries.
        // BullMQ will automatically retry. We only mark FAILED when it exceeds attempts.
        // However, if we want to reflect intermediate states, we could set 'FAILED' but that might conflict.
        // For now, let's just let it throw and handle permanent failures in the 'failed' event listener.
        throw error;
    }
}, { connection });
exports.emailWorker = new bullmq_1.Worker('emailQueue', async (job) => {
    const { notificationId } = job.data;
    const notification = await prisma_service_1.prisma.notification.findUnique({
        where: { id: notificationId },
        include: { user: true }
    });
    if (!notification)
        return;
    try {
        // Simulated Email Provider Call
        // console.log(`Sending Email to ${notification.user.email}: ${notification.body}`);
        await prisma_service_1.prisma.notification.update({
            where: { id: notificationId },
            data: { status: 'SENT', sentAt: new Date() }
        });
    }
    catch (error) {
        throw error;
    }
}, { connection });
// Permanent failures (Dead Letter Queue logic)
exports.smsWorker.on('failed', async (job, err) => {
    if (job) {
        const { notificationId } = job.data;
        // Check if job has exhausted all attempts
        if (job.attemptsMade >= job.opts.attempts) {
            await prisma_service_1.prisma.notification.update({
                where: { id: notificationId },
                data: { status: 'FAILED' }
            });
        }
    }
});
exports.emailWorker.on('failed', async (job, err) => {
    if (job) {
        const { notificationId } = job.data;
        if (job.attemptsMade >= job.opts.attempts) {
            await prisma_service_1.prisma.notification.update({
                where: { id: notificationId },
                data: { status: 'FAILED' }
            });
        }
    }
});
