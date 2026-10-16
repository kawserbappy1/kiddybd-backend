"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAddress = exports.updateAddress = exports.addAddress = exports.getAddresses = exports.updateProfile = exports.getProfile = void 0;
const user_service_1 = require("./user.service");
const getProfile = async (req, res) => {
    const user = await user_service_1.userService.getProfile(req.user.userId);
    res.status(200).json({
        success: true,
        status: 'success',
        data: { user },
    });
};
exports.getProfile = getProfile;
const updateProfile = async (req, res) => {
    const user = await user_service_1.userService.updateProfile(req.user.userId, req.body);
    res.status(200).json({
        success: true,
        status: 'success',
        data: { user },
        message: 'Profile updated successfully',
    });
};
exports.updateProfile = updateProfile;
const getAddresses = async (req, res) => {
    const addresses = await user_service_1.userService.getAddresses(req.user.userId);
    res.status(200).json({
        status: 'success',
        data: { addresses },
    });
};
exports.getAddresses = getAddresses;
const addAddress = async (req, res) => {
    const address = await user_service_1.userService.addAddress(req.user.userId, req.body);
    res.status(201).json({
        status: 'success',
        data: { address },
    });
};
exports.addAddress = addAddress;
const updateAddress = async (req, res) => {
    const address = await user_service_1.userService.updateAddress(req.user.userId, req.params.id, req.body);
    res.status(200).json({
        status: 'success',
        data: { address },
    });
};
exports.updateAddress = updateAddress;
const deleteAddress = async (req, res) => {
    await user_service_1.userService.deleteAddress(req.user.userId, req.params.id);
    res.status(204).send();
};
exports.deleteAddress = deleteAddress;
