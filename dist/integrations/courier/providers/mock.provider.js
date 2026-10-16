"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockCourierProvider = void 0;
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
class MockCourierProvider {
    async createShipment(request) {
        return {
            trackingId: `MOCK-${(0, crypto_1.randomUUID)().substring(0, 8).toUpperCase()}`,
            consignmentId: (0, crypto_1.randomUUID)(),
            shippingCost: 60,
        };
    }
    async cancelShipment(trackingId) {
        return true;
    }
    async trackShipment(trackingId) {
        return {
            trackingId,
            status: 'pending',
        };
    }
    async getRates(weight, district) {
        return district.toLowerCase() === 'dhaka' ? 60 : 120;
    }
    async handleWebhook(payload, signature) {
        // In mock, signature = "valid" is valid
        const isValid = signature === 'valid';
        let mappedStatus = client_1.ShipmentStatus.IN_TRANSIT;
        if (payload.status === 'delivered')
            mappedStatus = client_1.ShipmentStatus.DELIVERED;
        if (payload.status === 'returned')
            mappedStatus = client_1.ShipmentStatus.RETURNED;
        return {
            isValid,
            externalEventId: payload.eventId || (0, crypto_1.randomUUID)(),
            status: mappedStatus,
            externalStatus: payload.status || 'unknown',
            trackingId: payload.trackingId,
            occurredAt: new Date(),
        };
    }
}
exports.MockCourierProvider = MockCourierProvider;
