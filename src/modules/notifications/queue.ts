import { Queue } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
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

export const smsQueue = new Queue('smsQueue', { connection, defaultJobOptions });
export const emailQueue = new Queue('emailQueue', { connection, defaultJobOptions });
export const notificationQueue = new Queue('notificationQueue', { connection, defaultJobOptions });
