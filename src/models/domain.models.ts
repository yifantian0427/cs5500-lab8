import { Schema, model } from 'mongoose';
import type {
  User,
  Resource,
  ReservationStatus,
} from '../types/reservation.js';
export interface ReservationDocument {
  id: string;
  resourceId: string;
  userId: string;
  startTime: Date;
  endTime: Date;
  status: ReservationStatus;
}
const idField = {
  type: String,
  required: true,
  match: /^[A-Za-z0-9_-]{1,100}$/,
};
const options = {
  strict: 'throw' as const,
  versionKey: false as const,
  id: false,
};
export const userSchema = new Schema<User>(
  { id: { ...idField, unique: true }, name: { type: String, required: true } },
  options,
);
export const resourceSchema = new Schema<Resource>(
  {
    id: { ...idField, unique: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['ROOM', 'EQUIPMENT', 'LAB'], required: true },
    location: { type: String, required: true },
    isAvailable: { type: Boolean, required: true },
  },
  options,
);
export const reservationSchema = new Schema<ReservationDocument>(
  {
    id: { ...idField, unique: true },
    resourceId: idField,
    userId: idField,
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'CANCELLED'],
      required: true,
    },
  },
  options,
);
reservationSchema.index({ resourceId: 1, startTime: 1, endTime: 1, status: 1 });
reservationSchema.index({ userId: 1, status: 1 });
export const UserModel = model<User>('User', userSchema);
export const ResourceModel = model<Resource>('Resource', resourceSchema);
export const ReservationModel = model<ReservationDocument>(
  'Reservation',
  reservationSchema,
);
