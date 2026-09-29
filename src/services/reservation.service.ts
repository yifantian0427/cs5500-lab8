import { randomUUID } from 'node:crypto';
import type {
  CreateReservationRequest,
  Reservation,
  Resource,
  ResourceType,
  ErrorStatus,
} from '../types/reservation.js';
export class ApiError extends Error {
  constructor(
    public readonly status: ErrorStatus,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}
export const initialResources: Resource[] = [
  {
    id: 'res-101',
    name: 'Study Room 302',
    type: 'ROOM',
    location: 'Library, Floor 3',
    isAvailable: true,
  },
  {
    id: 'res-102',
    name: '3D Printer A',
    type: 'EQUIPMENT',
    location: 'Maker Space',
    isAvailable: true,
  },
  {
    id: 'res-103',
    name: 'Chemistry Lab',
    type: 'LAB',
    location: 'Science Building',
    isAvailable: false,
  },
];
export class ReservationService {
  constructor(
    private readonly resources: Resource[] = structuredClone(initialResources),
    private readonly reservations: Reservation[] = [],
  ) {}
  listResources(type?: ResourceType): Resource[] {
    return structuredClone(
      this.resources.filter((r) => !type || r.type === type),
    );
  }
  listUserReservations(userId: string): Reservation[] {
    return structuredClone(
      this.reservations.filter(
        (r) => r.userId === userId && r.status !== 'CANCELLED',
      ),
    );
  }
  create(input: CreateReservationRequest): Reservation {
    const resource = this.resources.find((r) => r.id === input.resourceId);
    if (!resource)
      throw new ApiError(400, 'RESOURCE_NOT_FOUND', 'Resource does not exist.');
    if (!resource.isAvailable)
      throw new ApiError(
        400,
        'RESOURCE_UNAVAILABLE',
        'Resource is unavailable.',
      );
    const start = Date.parse(input.startTime),
      end = Date.parse(input.endTime);
    if (!(start < end))
      throw new ApiError(
        400,
        'VALIDATION_ERROR',
        'startTime must be before endTime.',
      );
    if (
      this.reservations.some(
        (r) =>
          r.resourceId === input.resourceId &&
          r.status !== 'CANCELLED' &&
          start < Date.parse(r.endTime) &&
          end > Date.parse(r.startTime),
      )
    ) {
      throw new ApiError(
        409,
        'DOUBLE_BOOKING',
        'Resource is already reserved for this time slot.',
      );
    }
    // No await between overlap check and insert: atomic within this single-process demo.
    const reservation: Reservation = {
      ...input,
      id: randomUUID(),
      status: 'CONFIRMED',
    };
    this.reservations.push(reservation);
    return { ...reservation };
  }
}
