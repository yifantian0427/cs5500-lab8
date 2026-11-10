// Shared wire contract: ISO 8601 dates are strings, not Date objects.
import type {
  ResourceType,
  Resource,
  Reservation,
  ErrorResponse,
  CreateReservationRequest as CreateReservationDTO,
} from '../../../src/types/reservation';
export type {
  ResourceType,
  Resource,
  Reservation,
  ErrorResponse,
  CreateReservationRequest as CreateReservationDTO,
} from '../../../src/types/reservation';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
const base = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(
  /\/$/,
  '',
);
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${base}${path}`, {
      ...init,
      signal: controller.signal,
    });
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const details =
        body && typeof body === 'object'
          ? (body as Partial<ErrorResponse>)
          : {};
      throw new ApiError(
        response.status,
        typeof details.message === 'string'
          ? details.message
          : `Request failed (${response.status}).`,
        typeof details.code === 'string' ? details.code : undefined,
      );
    }
    if (body === null)
      throw new ApiError(
        response.status,
        'The server returned an invalid response.',
      );
    return body as T;
  } catch (error: unknown) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      0,
      controller.signal.aborted
        ? 'The request timed out. Please try again.'
        : 'Cannot reach CampusHub. Check that the backend is running, then retry.',
    );
  } finally {
    clearTimeout(timer);
  }
}
export function fetchResources(type?: ResourceType): Promise<Resource[]> {
  return request(
    `/resources${type ? `?type=${encodeURIComponent(type)}` : ''}`,
  );
}
export function createReservation(
  payload: CreateReservationDTO,
): Promise<Reservation> {
  return request('/reservations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
export function fetchUserReservations(userId: string): Promise<Reservation[]> {
  return request(`/reservations/user/${encodeURIComponent(userId)}`);
}
export function cancelReservation(reservationId: string): Promise<Reservation> {
  return request(`/reservations/${encodeURIComponent(reservationId)}/cancel`, {
    method: 'PATCH',
  });
}
export function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Something went wrong. Please try again.';
}
