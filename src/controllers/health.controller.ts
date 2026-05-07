import { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { buildResponse } from '../utils/response';
import { HealthResponse } from '../types/api.types';
import env from '../config/env';

export const getHealth = asyncHandler(async (_req: Request, res: Response) => {
  const health: HealthResponse = {
    status: 'healthy',
    uptime: process.uptime(),
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  };

  buildResponse.success(res, health);
});
