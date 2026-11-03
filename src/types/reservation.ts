/** Contract-derived API types. Dates are serialized ISO 8601 strings. */
export type ResourceType = 'ROOM' | 'EQUIPMENT' | 'LAB';
export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';
export interface User {
  id: string;
  name: string;
}
export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  location: string;
  isAvailable: boolean;
}
export interface CreateReservationRequest {
  resourceId: string;
  userId: string;
  startTime: string;
  endTime: string;
}
export interface Reservation extends CreateReservationRequest {
  id: string;
  status: ReservationStatus;
}
export interface ErrorResponse {
  code: string;
  message: string;
}
export type ErrorStatus = 400 | 409 | 500;
