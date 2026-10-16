import { Request, Response } from 'express';

export class HealthController {
  public check(req: Request, res: Response): void {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  }

  public live(req: Request, res: Response): void {
    res.status(200).json({ status: 'ok' });
  }

  public ready(req: Request, res: Response): void {
    // In future phases, actual DB/Redis checks will be added here
    res.status(200).json({
      status: 'ok',
      db: 'connected',
      redis: 'connected',
    });
  }
}
