import { Request, Response, NextFunction } from 'express';
import { settingsService } from './settings.service';

export class SettingsController {
  getSettings = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const settings = await settingsService.getSettings();
      res.status(200).json({
        success: true,
        data: settings,
      });
    } catch (error) {
      next(error);
    }
  };

  updateSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await settingsService.updateSettings(req.body);
      res.status(200).json({
        success: true,
        data: updated,
        message: 'Settings updated successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}

export const settingsController = new SettingsController();
