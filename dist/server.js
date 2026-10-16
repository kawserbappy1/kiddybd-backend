"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const env_1 = require("./config/env");
const logger_1 = require("./config/logger");
const PORT = env_1.env.PORT || 3000;
const server = app_1.app.listen(PORT, () => {
    logger_1.logger.info(`Server is running on port ${PORT} in ${env_1.env.NODE_ENV} mode (email OTP enabled)`);
});
// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    logger_1.logger.error(`[UNHANDLED_REJECTION] ${err.message}`, { stack: err.stack });
    server.close(() => {
        process.exit(1);
    });
});
process.on('uncaughtException', (err) => {
    logger_1.logger.error(`[UNCAUGHT_EXCEPTION] ${err.message}`, { stack: err.stack });
    server.close(() => {
        process.exit(1);
    });
});
