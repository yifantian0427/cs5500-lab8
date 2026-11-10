import type { Request, Response } from 'express';
import {
  getHealthStatus,
  type HealthStatus,
} from '../services/health.service.js';

// Express 5 forwards rejected async handlers to errorHandler.
export const getHealth = async (
  _request: Request,
  response: Response<HealthStatus>,
): Promise<void> => {
  response.status(200).json(await getHealthStatus());
};
