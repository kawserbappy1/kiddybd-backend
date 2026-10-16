"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SSLCommerzProvider = void 0;
class SSLCommerzProvider {
    storeId;
    storePassword;
    isSandbox;
    baseUrl;
    constructor() {
        this.storeId = process.env.SSLCOMMERZ_STORE_ID || 'kiddy6acfd20758791';
        this.storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD || 'kiddy6acfd20758791@ssl';
        this.isSandbox = process.env.SSLCOMMERZ_IS_SANDBOX !== 'false';
        this.baseUrl = this.isSandbox
            ? 'https://sandbox.sslcommerz.com'
            : 'https://securepay.sslcommerz.com';
    }
    async createPayment(paymentId, orderId, amount, customerInfo) {
        const transactionId = `SSLCZ_${Date.now().toString().slice(-8)}_${paymentId.substring(0, 6)}`;
        const backendBaseUrl = process.env.BACKEND_BASE_URL || 'http://localhost:5000';
        const params = new URLSearchParams({
            store_id: this.storeId,
            store_passwd: this.storePassword,
            total_amount: amount.toFixed(2),
            currency: 'BDT',
            tran_id: transactionId,
            success_url: `${backendBaseUrl}/api/v1/payments/sslcommerz/success`,
            fail_url: `${backendBaseUrl}/api/v1/payments/sslcommerz/fail`,
            cancel_url: `${backendBaseUrl}/api/v1/payments/sslcommerz/cancel`,
            ipn_url: `${backendBaseUrl}/api/v1/payments/sslcommerz/ipn`,
            // Customer Details
            cus_name: customerInfo.name || 'Customer',
            cus_email: customerInfo.email || 'customer@kiddybd.com',
            cus_add1: customerInfo.address || 'Dhaka',
            cus_city: customerInfo.city || 'Dhaka',
            cus_postcode: customerInfo.postcode || '1200',
            cus_country: 'Bangladesh',
            cus_phone: customerInfo.phone || '01700000000',
            // Shipping Details
            shipping_method: 'COURIER',
            ship_name: customerInfo.name || 'Customer',
            ship_add1: customerInfo.address || 'Dhaka',
            ship_city: customerInfo.city || 'Dhaka',
            ship_postcode: customerInfo.postcode || '1200',
            ship_country: 'Bangladesh',
            // Product Info
            product_name: 'KiddyBD Toys & Essentials',
            product_category: 'Baby & Kids',
            product_profile: 'general',
            // Value A pass-through parameters to retain paymentId & orderId
            value_a: paymentId,
            value_b: orderId,
        });
        try {
            const response = await fetch(`${this.baseUrl}/gwprocess/v4/api.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: params.toString(),
            });
            const data = await response.json();
            if (data.status === 'SUCCESS' && data.GatewayPageURL) {
                return {
                    redirectUrl: data.GatewayPageURL,
                    transactionId,
                };
            }
            console.error('SSLCommerz Session Error:', data);
            throw new Error(data.failedreason || 'Failed to initialize SSLCommerz payment');
        }
        catch (error) {
            console.error('SSLCommerz createPayment failed:', error);
            throw error;
        }
    }
    async verifyPayment(valId) {
        try {
            const verifyUrl = `${this.baseUrl}/validator/api/validationserverAPI.php?val_id=${valId}&store_id=${this.storeId}&store_passwd=${this.storePassword}&format=json`;
            const response = await fetch(verifyUrl);
            const data = await response.json();
            return data.status === 'VALID' || data.status === 'VALIDATED';
        }
        catch (error) {
            console.error('SSLCommerz validation error:', error);
            return false;
        }
    }
    async refundPayment(transactionId, amount) {
        // In production, call /validator/api/merchantTransIDvalidationAPI.php or refund API
        return true;
    }
    async handleWebhook(payload, signature) {
        // SSLCommerz sends IPN with val_id, tran_id, status, amount, etc.
        const valId = payload.val_id;
        let isValid = false;
        if (valId) {
            isValid = await this.verifyPayment(valId);
        }
        else if (payload.status === 'VALID') {
            isValid = true;
        }
        return {
            isValid,
            transactionId: payload.tran_id,
            status: (payload.status === 'VALID' || payload.status === 'VALIDATED' ? 'SUCCESS' : 'FAILED'),
            externalEventId: payload.val_id || `ev_${Date.now()}`,
        };
    }
}
exports.SSLCommerzProvider = SSLCommerzProvider;
