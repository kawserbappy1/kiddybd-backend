import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { prisma } from '../../database/prisma.service';

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const smsWorker = new Worker('smsQueue', async (job: Job) => {
  const { notificationId } = job.data;
  
  const notification = await prisma.notification.findUnique({ 
    where: { id: notificationId }, 
    include: { user: true } 
  });
  
  if (!notification) return;

  try {
    // Simulated SMS Provider Call
    // console.log(`Sending SMS to ${notification.user.phone}: ${notification.body}`);
    
    // Check if we should simulate a failure based on metadata for testing purposes
    const metadata = notification.metadata as any;
    if (metadata && metadata.simulateFailure) {
      throw new Error('Simulated failure');
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { status: 'SENT', sentAt: new Date() }
    });
  } catch (error) {
    // We do NOT update to FAILED immediately on error if we rely on BullMQ retries.
    // BullMQ will automatically retry. We only mark FAILED when it exceeds attempts.
    // However, if we want to reflect intermediate states, we could set 'FAILED' but that might conflict.
    // For now, let's just let it throw and handle permanent failures in the 'failed' event listener.
    throw error;
  }
}, { connection });

export const emailWorker = new Worker('emailQueue', async (job: Job) => {
  const { notificationId } = job.data;
  
  const notification = await prisma.notification.findUnique({ 
    where: { id: notificationId }, 
    include: { user: true } 
  });
  
  if (!notification) return;

  try {
    // Simulated Email Provider Call
    // console.log(`Sending Email to ${notification.user.email}: ${notification.body}`);
    
    await prisma.notification.update({
      where: { id: notificationId },
      data: { status: 'SENT', sentAt: new Date() }
    });
  } catch (error) {
    throw error;
  }
}, { connection });

// Permanent failures (Dead Letter Queue logic)
smsWorker.on('failed', async (job, err) => {
  if (job) {
    const { notificationId } = job.data;
    // Check if job has exhausted all attempts
    if (job.attemptsMade >= job.opts.attempts!) {
      await prisma.notification.update({
        where: { id: notificationId },
        data: { status: 'FAILED' }
      });
    }
  }
});

emailWorker.on('failed', async (job, err) => {
  if (job) {
    const { notificationId } = job.data;
    if (job.attemptsMade >= job.opts.attempts!) {
      await prisma.notification.update({
        where: { id: notificationId },
        data: { status: 'FAILED' }
      });
    }
  }
});
