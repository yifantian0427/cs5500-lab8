import type { NextFunction, Request, Response } from 'express';
import {
  getHealthStatus,
  type HealthStatus,
} from '../services/health.service.js';

export const getHealth = async (
  _request: Request,
  response: Response<HealthStatus>,
  next: NextFunction,
): Promise<void> => {
  try {
    const status: HealthStatus = await getHealthStatus();
    response.status(200).json(status);
  } catch (error: unknown) {
    next(error);
  }
};
