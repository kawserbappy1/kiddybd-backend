"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrderSchema = void 0;
const zod_1 = require("zod");
exports.createOrderSchema = zod_1.z.object({
    body: zod_1.z.object({
        cartId: zod_1.z.string().uuid(),
        addressId: zod_1.z.string().uuid(),
        couponCode: zod_1.z.string().optional(),
        paymentMethod: zod_1.z.enum(['COD', 'ONLINE']),
    }),
});
