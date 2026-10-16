"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAddressSchema = exports.createAddressSchema = exports.updateProfileSchema = void 0;
const zod_1 = require("zod");
exports.updateProfileSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must not exceed 50 characters').optional(),
        avatarUrl: zod_1.z.string().url('Invalid image URL').nullable().optional(),
    }),
});
exports.createAddressSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2),
        phone: zod_1.z.string().regex(/^01\d{9}$/, 'Invalid BD phone number format'),
        division: zod_1.z.string().min(2),
        district: zod_1.z.string().min(2),
        upazila: zod_1.z.string().min(2),
        area: zod_1.z.string().min(2),
        addressLine: zod_1.z.string().min(5),
        landmark: zod_1.z.string().optional(),
        postalCode: zod_1.z.string().optional(),
        latitude: zod_1.z.number().optional(),
        longitude: zod_1.z.number().optional(),
        isDefault: zod_1.z.boolean().optional(),
    }),
});
exports.updateAddressSchema = zod_1.z.object({
    body: exports.createAddressSchema.shape.body.partial(),
});
