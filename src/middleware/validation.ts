import { ApiError } from '../services/reservation.service.js';
import type {
  CreateReservationRequest,
  ResourceType,
} from '../types/reservation.js';
export function invalid(message: string): never {
  throw new ApiError(400, 'VALIDATION_ERROR', message);
}
export function identifier(value: unknown): string {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{1,100}$/.test(value))
    return invalid(
      'IDs must contain 1-100 letters, digits, underscores or hyphens.',
    );
  return value;
}
export function resourceType(value: unknown): ResourceType | undefined {
  if (value === undefined) return undefined;
  if (value !== 'ROOM' && value !== 'EQUIPMENT' && value !== 'LAB')
    return invalid('type must be ROOM, EQUIPMENT or LAB when provided.');
  return value;
}
export function dateTime(value: unknown): string {
  if (typeof value !== 'string') return invalid('Date-time must be a string.');
  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/.exec(
      value,
    );
  if (!match)
    return invalid(
      'Date-time must be ISO 8601 with a timezone and at most millisecond precision.',
    );
  const year = Number(match[1]),
    month = Number(match[2]),
    day = Number(match[3]);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const zone = match[8] ?? '';
  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > (days[month - 1] ?? 0) ||
    Number(match[4]) > 23 ||
    Number(match[5]) > 59 ||
    Number(match[6]) > 59 ||
    (zone !== 'Z' &&
      (Number(zone.slice(1, 3)) > 23 || Number(zone.slice(4, 6)) > 59)) ||
    !Number.isFinite(Date.parse(value))
  )
    return invalid('Date-time contains an invalid calendar date or time.');
  return value;
}
export function reservationBody(value: unknown): CreateReservationRequest {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    return invalid('Body must be a JSON object.');
  const body = value as Record<string, unknown>;
  if (
    Object.keys(body).some(
      (key) => !['resourceId', 'userId', 'startTime', 'endTime'].includes(key),
    )
  )
    return invalid('Unexpected request body property.');
  return {
    resourceId: identifier(body.resourceId),
    userId: identifier(body.userId),
    startTime: dateTime(body.startTime),
    endTime: dateTime(body.endTime),
  };
}
