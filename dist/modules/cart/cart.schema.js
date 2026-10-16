"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.itemIdSchema = exports.updateItemSchema = exports.addItemSchema = void 0;
const zod_1 = require("zod");
exports.addItemSchema = zod_1.z.object({
    body: zod_1.z.object({
        variantId: zod_1.z.string().uuid(),
        quantity: zod_1.z.number().int().positive(),
    }),
});
exports.updateItemSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid(),
    }),
    body: zod_1.z.object({
        quantity: zod_1.z.number().int().positive(),
    }),
});
exports.itemIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid(),
    }),
});
