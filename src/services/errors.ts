import type { ErrorStatus } from '../types/reservation.js';
export class ApiError extends Error {
  constructor(
    public readonly status: ErrorStatus,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}
