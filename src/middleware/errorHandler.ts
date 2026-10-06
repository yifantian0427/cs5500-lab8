import type { ErrorRequestHandler } from 'express';
import { ApiError } from '../services/errors.js';
import type { ErrorResponse } from '../types/reservation.js';
export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _request,
  response,
  _next,
): void => {
  if (error instanceof ApiError) {
    response.status(error.status).json({
      code: error.code,
      message: error.message,
    } satisfies ErrorResponse);
    return;
  }
  if (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof error.status === 'number' &&
    error.status >= 400 &&
    error.status < 500
  ) {
    response.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Invalid JSON, URL encoding or request body.',
    } satisfies ErrorResponse);
    return;
  }
  response.status(500).json({
    code: 'INTERNAL_ERROR',
    message: 'Internal server error.',
  } satisfies ErrorResponse);
};
