import { app } from './app';
import { env } from './config/env';
import { logger } from './config/logger';

const PORT = env.PORT || 3000;

const server = app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT} in ${env.NODE_ENV} mode (email OTP enabled)`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  logger.error(`[UNHANDLED_REJECTION] ${err.message}`, { stack: err.stack });
  server.close(() => {
    process.exit(1);
  });
});

process.on('uncaughtException', (err: Error) => {
  logger.error(`[UNCAUGHT_EXCEPTION] ${err.message}`, { stack: err.stack });
  server.close(() => {
    process.exit(1);
  });
});
