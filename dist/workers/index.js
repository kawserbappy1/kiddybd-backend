"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("../config/logger");
// Import workers to start them
require("./cron.worker");
const cron_queue_1 = require("../queues/cron.queue");
(0, cron_queue_1.setupCronJobs)().then(() => {
    logger_1.logger.info('Cron jobs scheduled successfully');
}).catch((err) => {
    logger_1.logger.error('Failed to schedule cron jobs', err);
});
// Handle graceful shutdown
const shutdown = () => {
    logger_1.logger.info('Shutting down workers...');
    // Here we would safely close the workers (e.g. cronWorker.close())
    process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
logger_1.logger.info('Workers started successfully');
