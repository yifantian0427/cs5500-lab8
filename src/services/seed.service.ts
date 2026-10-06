import { ResourceModel } from '../models/Resource.model.js';
import type { Resource } from '../types/reservation.js';
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
export async function seedResources(): Promise<void> {
  for (const resource of initialResources)
    await ResourceModel.updateOne(
      { id: resource.id },
      { $setOnInsert: resource },
      { upsert: true },
    ).exec();
}
