"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const inventory_controller_1 = require("./inventory.controller");
const router = (0, express_1.Router)();
// Routes for INVENTORY_MANAGER
router.get('/:variantId', inventory_controller_1.getStock);
router.patch('/:variantId', inventory_controller_1.adjustStock);
exports.default = router;
