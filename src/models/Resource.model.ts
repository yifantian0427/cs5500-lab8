import { Schema, model } from 'mongoose';
import type { ResourceType } from '../types/reservation.js';
export interface ResourceDocument {
  id: string;
  name: string;
  type: ResourceType;
  location: string;
  isAvailable: boolean;
  bookingVersion: number;
}
export const resourceSchema = new Schema<ResourceDocument>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      match: /^[A-Za-z0-9_-]{1,100}$/,
    },
    name: { type: String, required: true, trim: true },
    type: { type: String, required: true, enum: ['ROOM', 'EQUIPMENT', 'LAB'] },
    location: { type: String, required: true, trim: true },
    isAvailable: { type: Boolean, required: true },
    bookingVersion: { type: Number, required: true, default: 0 },
  },
  { strict: 'throw', versionKey: false, id: false },
);
export const ResourceModel = model<ResourceDocument>(
  'Resource',
  resourceSchema,
);
