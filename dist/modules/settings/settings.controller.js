"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsController = exports.SettingsController = void 0;
const settings_service_1 = require("./settings.service");
class SettingsController {
    getSettings = async (_req, res, next) => {
        try {
            const settings = await settings_service_1.settingsService.getSettings();
            res.status(200).json({
                success: true,
                data: settings,
            });
        }
        catch (error) {
            next(error);
        }
    };
    updateSettings = async (req, res, next) => {
        try {
            const updated = await settings_service_1.settingsService.updateSettings(req.body);
            res.status(200).json({
                success: true,
                data: updated,
                message: 'Settings updated successfully',
            });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.SettingsController = SettingsController;
exports.settingsController = new SettingsController();
