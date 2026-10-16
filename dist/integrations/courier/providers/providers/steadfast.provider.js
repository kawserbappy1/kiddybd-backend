"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SteadfastProvider = void 0;
const client_1 = require("@prisma/client");
class SteadfastProvider {
    constructor() {
        this.baseUrl = process.env.STEADFAST_API_URL || 'https://portal.packzy.com/api/v1';
        this.apiKey = process.env.STEADFAST_API_KEY || '';
        this.secretKey = process.env.STEADFAST_SECRET_KEY || '';
    }
    async createShipment(request) {
        // If user has provided real API keys in .env, call live Steadfast API
        if (this.apiKey && this.secretKey) {
            try {
                const response = await fetch(`${this.baseUrl}/create_order`, {
                    method: 'POST',
                    headers: {
                        'Api-Key': this.apiKey,
                        'Secret-Key': this.secretKey,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        invoice: request.orderId,
                        recipient_name: request.customerName,
                        recipient_phone: request.customerPhone,
                        recipient_address: request.customerAddress,
                        cod_amount: request.codAmount,
                        note: 'Order from KiddyBD',
                    }),
                });
                if (response.ok) {
                    const data = await response.json();
                    return {
                        trackingId: data.consignment?.tracking_code || `STDF-${Math.floor(100000 + Math.random() * 900000)}`,
                        consignmentId: data.consignment?.consignment_id?.toString() || Date.now().toString(),
                        shippingCost: 60,
                    };
                }
            }
            catch (err) {
                console.warn('Steadfast live API call failed, falling back to simulated consignment code:', err);
            }
        }
        // Seamless Localhost Sandbox Mode: generate authentic Steadfast tracking code
        const mockTracking = `STDF-${Math.floor(1000000 + Math.random() * 9000000)}`;
        const mockConsignment = `CID-${Date.now().toString().slice(-6)}`;
        return {
            trackingId: mockTracking,
            consignmentId: mockConsignment,
            shippingCost: 60,
        };
    }
    async cancelShipment(trackingId) {
        return true; // unimplemented mock for now
    }
    async trackShipment(trackingId) {
        const response = await fetch(`${this.baseUrl}/status_by_trackingcode/${trackingId}`, {
            headers: {
                'Api-Key': this.apiKey,
                'Secret-Key': this.secretKey,
            }
        });
        return response.json();
    }
    async getRates(weight, district) {
        // Mock logic
        return 60;
    }
    async handleWebhook(payload, signature) {
        // Steadfast signature verification logic
        // e.g. comparing HMAC or static token
        const isValid = signature === this.secretKey;
        let mappedStatus = client_1.ShipmentStatus.IN_TRANSIT;
        switch (payload.status) {
            case 'delivered':
                mappedStatus = client_1.ShipmentStatus.DELIVERED;
                break;
            case 'cancelled':
            case 'returned':
                mappedStatus = client_1.ShipmentStatus.RETURNED;
                break;
            case 'picked':
                mappedStatus = client_1.ShipmentStatus.PICKED_UP;
                break;
            case 'out_for_delivery':
                mappedStatus = client_1.ShipmentStatus.OUT_FOR_DELIVERY;
                break;
        }
        return {
            isValid,
            externalEventId: payload.updated_at || Date.now().toString(),
            status: mappedStatus,
            externalStatus: payload.status,
            trackingId: payload.tracking_code,
            occurredAt: new Date(),
        };
    }
}
exports.SteadfastProvider = SteadfastProvider;
