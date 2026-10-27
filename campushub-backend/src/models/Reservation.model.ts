import { Schema, model, type Types } from 'mongoose';
import type { ReservationStatus } from '../types/reservation.js';
export interface ReservationDocument {
  id: string;
  resourceId: Types.ObjectId;
  userId: string;
  startTime: Date;
  endTime: Date;
  startTimeText: string;
  endTimeText: string;
  status: ReservationStatus;
}
export const reservationSchema = new Schema<ReservationDocument>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      match: /^[A-Za-z0-9_-]{1,100}$/,
    },
    resourceId: {
      type: Schema.Types.ObjectId,
      ref: 'Resource',
      required: true,
    },
    userId: { type: String, required: true, match: /^[A-Za-z0-9_-]{1,100}$/ },
    startTime: { type: Date, required: true },
    endTime: {
      type: Date,
      required: true,
      validate: {
        validator: function (this: ReservationDocument, value: Date): boolean {
          return this.startTime < value;
        },
        message: 'startTime must be before endTime.',
      },
    },
    // Preserve the contract's original timestamp representation on round trips.
    startTimeText: { type: String, required: true },
    endTimeText: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: ['PENDING', 'CONFIRMED', 'CANCELLED'],
    },
  },
  { strict: 'throw', versionKey: false, id: false },
);
reservationSchema.index({ resourceId: 1, status: 1, startTime: 1, endTime: 1 });
reservationSchema.index({ userId: 1, status: 1 });
export const ReservationModel = model<ReservationDocument>(
  'Reservation',
  reservationSchema,
);
