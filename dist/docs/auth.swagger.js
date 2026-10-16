"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const registry_1 = require("./registry");
const auth_validation_1 = require("../modules/auth/auth.validation");
const zod_1 = require("zod");
// Register Schemas
registry_1.registry.register('SendPhoneOTPRequest', auth_validation_1.sendPhoneOTPSchema.shape.body);
registry_1.registry.register('VerifyPhoneOTPRequest', auth_validation_1.verifyPhoneOTPSchema.shape.body);
registry_1.registry.registerPath({
    method: 'post',
    path: '/auth/send-phone-otp',
    summary: 'Send Phone OTP',
    tags: ['Auth'],
    request: {
        body: {
            content: {
                'application/json': {
                    schema: auth_validation_1.sendPhoneOTPSchema.shape.body,
                },
            },
        },
    },
    responses: {
        200: {
            description: 'OTP sent successfully',
            content: {
                'application/json': {
                    schema: zod_1.z.object({ message: zod_1.z.string() }),
                },
            },
        },
    },
});
registry_1.registry.registerPath({
    method: 'post',
    path: '/auth/verify-phone-otp',
    summary: 'Verify Phone OTP',
    tags: ['Auth'],
    request: {
        body: {
            content: {
                'application/json': {
                    schema: auth_validation_1.verifyPhoneOTPSchema.shape.body,
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Login successful',
            content: {
                'application/json': {
                    schema: zod_1.z.object({
                        user: zod_1.z.any(),
                        accessToken: zod_1.z.string(),
                        refreshToken: zod_1.z.string(),
                    }),
                },
            },
        },
    },
});
