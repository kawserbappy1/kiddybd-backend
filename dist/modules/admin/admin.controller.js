"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const admin_service_1 = require("./admin.service");
class AdminController {
    adminService;
    constructor() {
        this.adminService = new admin_service_1.AdminService();
    }
    getOrders = async (req, res, next) => {
        try {
            const result = await this.adminService.getOrders(req.query);
            res.status(200).json({ success: true, ...result });
        }
        catch (error) {
            next(error);
        }
    };
    getOrderById = async (req, res, next) => {
        try {
            const order = await this.adminService.getOrderById(req.params.id);
            res.status(200).json({ success: true, data: order });
        }
        catch (error) {
            next(error);
        }
    };
    updateOrderStatus = async (req, res, next) => {
        try {
            const { status } = req.body;
            const changedBy = (req.user?.userId || req.user?.id);
            const order = await this.adminService.updateOrderStatus(req.params.id, status, changedBy);
            res.status(200).json({ success: true, data: order });
        }
        catch (error) {
            next(error);
        }
    };
    assignCourier = async (req, res, next) => {
        try {
            const { courierId, courier, trackingCode } = req.body;
            const courierName = courier || courierId || 'Pathao';
            const shipment = await this.adminService.assignCourier(req.params.id, courierName, trackingCode);
            res.status(200).json({ success: true, data: shipment });
        }
        catch (error) {
            next(error);
        }
    };
    getCustomers = async (req, res, next) => {
        try {
            const result = await this.adminService.getCustomers(req.query);
            res.status(200).json({ success: true, ...result });
        }
        catch (error) {
            next(error);
        }
    };
    getCustomerById = async (req, res, next) => {
        try {
            const customer = await this.adminService.getCustomerById(req.params.id);
            res.status(200).json({ success: true, data: customer });
        }
        catch (error) {
            next(error);
        }
    };
    updateCustomerStatus = async (req, res, next) => {
        try {
            const { status } = req.body;
            const customer = await this.adminService.updateCustomerStatus(req.params.id, status);
            res.status(200).json({ success: true, data: customer });
        }
        catch (error) {
            next(error);
        }
    };
    getPayments = async (req, res, next) => {
        try {
            const result = await this.adminService.getPayments(req.query);
            res.status(200).json({ success: true, ...result });
        }
        catch (error) {
            next(error);
        }
    };
    getRefunds = async (req, res, next) => {
        try {
            const result = await this.adminService.getRefunds(req.query);
            res.status(200).json({ success: true, ...result });
        }
        catch (error) {
            next(error);
        }
    };
    getInventory = async (req, res, next) => {
        try {
            const items = await this.adminService.getInventory(req.query);
            res.status(200).json({ success: true, data: items });
        }
        catch (error) {
            next(error);
        }
    };
    adjustStock = async (req, res, next) => {
        try {
            const { adjustment, reason } = req.body;
            const result = await this.adminService.adjustStock(req.params.id, Number(adjustment) || 0, reason);
            res.status(200).json({ success: true, data: result, message: 'Stock adjusted successfully' });
        }
        catch (error) {
            next(error);
        }
    };
    getReturns = async (req, res, next) => {
        try {
            const items = await this.adminService.getReturns(req.query);
            res.status(200).json({ success: true, data: items });
        }
        catch (error) {
            next(error);
        }
    };
    approveReturn = async (req, res, next) => {
        try {
            const { refundMethod } = req.body;
            const result = await this.adminService.approveReturn(req.params.id, refundMethod || 'bKash');
            res.status(200).json({ success: true, data: result, message: 'Return approved' });
        }
        catch (error) {
            next(error);
        }
    };
    rejectReturn = async (req, res, next) => {
        try {
            const { reason } = req.body;
            const result = await this.adminService.rejectReturn(req.params.id, reason || 'Policy mismatch');
            res.status(200).json({ success: true, data: result, message: 'Return rejected' });
        }
        catch (error) {
            next(error);
        }
    };
    getMetrics = async (req, res, next) => {
        try {
            const metrics = await this.adminService.getMetrics();
            res.status(200).json({ success: true, data: metrics });
        }
        catch (error) {
            next(error);
        }
    };
    getAdminUsers = async (req, res, next) => {
        try {
            const users = await this.adminService.getAdminUsers();
            res.status(200).json({ success: true, data: users });
        }
        catch (error) {
            next(error);
        }
    };
    createAdminUser = async (req, res, next) => {
        try {
            const { name, email, phone, role, password } = req.body;
            const user = await this.adminService.createAdminUser({
                name,
                email,
                phone,
                role,
                password,
            });
            res.status(201).json({ success: true, data: user, message: 'Admin user configured successfully' });
        }
        catch (error) {
            next(error);
        }
    };
    updateAdminRole = async (req, res, next) => {
        try {
            const { role, status, password, name, email, phone, avatarUrl } = req.body;
            const user = await this.adminService.updateAdminRole(req.params.id, role, status, password, { name, email, phone, avatarUrl });
            res.status(200).json({ success: true, data: user, message: 'Admin details updated successfully' });
        }
        catch (error) {
            next(error);
        }
    };
    getAuditLogs = async (req, res, next) => {
        try {
            const result = await this.adminService.getAuditLogs(req.query);
            res.status(200).json({ success: true, ...result });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.AdminController = AdminController;
