"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedxProvider = void 0;
const client_1 = require("@prisma/client");
class RedxProvider {
    baseUrl = process.env.REDX_BASE_URL || 'https://openapi.redx.com.bd/v1.0.0-beta';
    accessToken = process.env.REDX_ACCESS_TOKEN || '';
    pickupStoreId = process.env.REDX_PICKUP_STORE_ID ? Number(process.env.REDX_PICKUP_STORE_ID) : 547713;
    async createShipment(request) {
        if (this.accessToken) {
            try {
                const payload = {
                    pickup_store_id: this.pickupStoreId,
                    merchant_invoice_id: request.orderId,
                    cash_collection_amount: request.codAmount || 0,
                    customer_name: request.customerName,
                    customer_phone: request.customerPhone,
                    customer_address: request.customerAddress,
                    delivery_area: 'General Area',
                    delivery_area_id: 1, // Fallback/default zone
                    parcel_weight: Math.round((request.weight || 1) * 1000), // In grams
                    value: Number(request.codAmount || 500),
                    instruction: 'Order from KiddyBD',
                };
                const response = await fetch(`${this.baseUrl}/parcel`, {
                    method: 'POST',
                    headers: {
                        'API-ACCESS-TOKEN': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify(payload),
                });
                const data = await response.json();
                if (response.ok && data?.tracking_id) {
                    return {
                        trackingId: data.tracking_id,
                        consignmentId: String(data.tracking_id),
                        shippingCost: 60,
                    };
                }
                else {
                    console.warn('REDX parcel create returned non-200 or no tracking_id:', data);
                }
            }
            catch (err) {
                console.warn('REDX live API call error, falling back to simulated consignment code:', err);
            }
        }
        // Fallback simulation
        const mockTracking = `REDX-${Math.floor(10000000 + Math.random() * 90000000)}`;
        return {
            trackingId: mockTracking,
            consignmentId: mockTracking,
            shippingCost: 60,
        };
    }
    async cancelShipment(trackingId) {
        return true;
    }
    async trackShipment(trackingId) {
        if (this.accessToken) {
            try {
                const response = await fetch(`${this.baseUrl}/parcel/info/${trackingId}`, {
                    headers: {
                        'API-ACCESS-TOKEN': `Bearer ${this.accessToken}`,
                        'Accept': 'application/json',
                    },
                });
                if (response.ok) {
                    return await response.json();
                }
            }
            catch (err) {
                console.warn('REDX tracking error:', err);
            }
        }
        return { status: 'In Transit', trackingId };
    }
    async getRates(weight, district) {
        return 60;
    }
    async handleWebhook(payload, signature) {
        let mappedStatus = client_1.ShipmentStatus.IN_TRANSIT;
        const status = (payload.status || '').toLowerCase();
        if (status.includes('delivered')) {
            mappedStatus = client_1.ShipmentStatus.DELIVERED;
        }
        else if (status.includes('return') || status.includes('cancel')) {
            mappedStatus = client_1.ShipmentStatus.RETURNED;
        }
        else if (status.includes('picked') || status.includes('pickup')) {
            mappedStatus = client_1.ShipmentStatus.PICKED_UP;
        }
        else if (status.includes('delivery')) {
            mappedStatus = client_1.ShipmentStatus.OUT_FOR_DELIVERY;
        }
        return {
            isValid: true,
            externalEventId: payload.updated_at || Date.now().toString(),
            status: mappedStatus,
            externalStatus: payload.status,
            trackingId: payload.tracking_id,
            occurredAt: new Date(),
        };
    }
}
exports.RedxProvider = RedxProvider;
