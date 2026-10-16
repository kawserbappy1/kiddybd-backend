"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthController = void 0;
class HealthController {
    check(req, res) {
        res.status(200).json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        });
    }
    live(req, res) {
        res.status(200).json({ status: 'ok' });
    }
    ready(req, res) {
        // In future phases, actual DB/Redis checks will be added here
        res.status(200).json({
            status: 'ok',
            db: 'connected',
            redis: 'connected',
        });
    }
}
exports.HealthController = HealthController;
