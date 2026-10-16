"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AndroidSmsGatewayProvider = exports.MockSmsProvider = void 0;
const env_1 = require("../../config/env");
class MockSmsProvider {
    async sendOTP(phone, otp) {
        console.log(`[Mock SMS] Sending OTP ${otp} to ${phone}`);
    }
}
exports.MockSmsProvider = MockSmsProvider;
/**
 * Android Gateway Provider:
 * Uses free Android SMS Gateway app (e.g. SMS Gateway, TextBee, or Traccar SMS Gateway)
 * installed on your Android phone to dispatch real SMS using your SIM card plan.
 */
class AndroidSmsGatewayProvider {
    async sendOTP(phone, otp) {
        const gatewayUrl = env_1.env.SMS_GATEWAY_URL;
        const apiKey = env_1.env.SMS_GATEWAY_API_KEY;
        const message = `Your KiddyBD verification code is: ${otp}. Valid for 5 minutes. Do not share this code.`;
        // Normalize phone number to BD international format (+880...)
        let formattedPhone = phone.trim();
        if (formattedPhone.startsWith('0')) {
            formattedPhone = `+88${formattedPhone}`;
        }
        else if (!formattedPhone.startsWith('+')) {
            formattedPhone = `+${formattedPhone}`;
        }
        if (!gatewayUrl) {
            console.log(`[SMS Gateway (Fallback Mock)] No SMS_GATEWAY_URL configured in .env. OTP: ${otp} for ${phone}`);
            return;
        }
        try {
            console.log(`[Android SMS Gateway] Dispatching OTP to ${formattedPhone} via ${gatewayUrl}...`);
            const headers = {
                'Content-Type': 'application/json',
            };
            if (apiKey) {
                headers['Authorization'] = apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`;
                headers['x-api-key'] = apiKey;
            }
            // Supports TextBee & common Android SMS Gateway payloads
            // Extracts deviceId from URL if present (e.g. /devices/{deviceId}/sendSMS)
            const deviceIdMatch = gatewayUrl.match(/\/devices\/([a-zA-Z0-9]+)/);
            const extractedDeviceId = deviceIdMatch ? deviceIdMatch[1] : undefined;
            const payload = {
                recipients: [formattedPhone],
                message,
            };
            if (extractedDeviceId) {
                payload.deviceId = extractedDeviceId;
            }
            // Default or configured SIM slot if needed (Teletalk subscriptionId=2, GP subscriptionId=3)
            if (process.env.SMS_SIM_SUBSCRIPTION_ID) {
                payload.simSubscriptionId = Number(process.env.SMS_SIM_SUBSCRIPTION_ID);
            }
            const response = await fetch(gatewayUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[Android SMS Gateway Error] Status ${response.status}: ${errorText}`);
            }
            else {
                const result = await response.json().catch(() => ({}));
                console.log(`[Android SMS Gateway Success] Real SMS queued for ${formattedPhone}! Batch:`, result?.data?.smsBatchId || 'OK');
            }
        }
        catch (err) {
            console.error(`[Android SMS Gateway Network Error] Failed to connect: ${err.message}`);
            // Fallback logging ensures dev testing is never completely broken
            console.log(`[Fallback OTP Log] OTP: ${otp} for ${phone}`);
        }
    }
}
exports.AndroidSmsGatewayProvider = AndroidSmsGatewayProvider;
