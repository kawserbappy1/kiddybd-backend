"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.firebasePhoneLoginSchema = exports.adminLoginSchema = exports.verifyEmailOTPSchema = exports.sendEmailOTPSchema = exports.verifyPhoneOTPSchema = exports.sendPhoneOTPSchema = void 0;
const zod_1 = require("zod");
exports.sendPhoneOTPSchema = zod_1.z.object({
    body: zod_1.z.object({
        phone: zod_1.z.string().regex(/^01[3-9]\d{8}$/, 'Invalid BD phone number'),
    }),
});
exports.verifyPhoneOTPSchema = zod_1.z.object({
    body: zod_1.z.object({
        phone: zod_1.z.string().regex(/^01[3-9]\d{8}$/, 'Invalid BD phone number'),
        otp: zod_1.z.string().length(6, 'OTP must be 6 digits'),
    }),
});
exports.sendEmailOTPSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email address'),
    }),
});
exports.verifyEmailOTPSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email address'),
        otp: zod_1.z.string().length(6, 'OTP must be 6 digits'),
    }),
});
exports.adminLoginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().min(1, 'Email or User ID is required'),
        password: zod_1.z.string().min(1, 'Password is required'),
    }),
});
exports.firebasePhoneLoginSchema = zod_1.z.object({
    body: zod_1.z.object({
        idToken: zod_1.z.string().min(1, 'Firebase ID token is required'),
        phone: zod_1.z.string().regex(/^01[3-9]\d{8}$/, 'Invalid BD phone number'),
    }),
});
