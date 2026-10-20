import { Schema, model } from 'mongoose';
import type { User } from '../types/reservation.js';
export { ResourceModel, resourceSchema } from './Resource.model.js';
export { ReservationModel, reservationSchema } from './Reservation.model.js';
export type { ReservationDocument } from './Reservation.model.js';
export const userSchema = new Schema<User>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      match: /^[A-Za-z0-9_-]{1,100}$/,
    },
    name: { type: String, required: true },
  },
  { strict: 'throw', versionKey: false, id: false },
);
export const UserModel = model<User>('User', userSchema);
