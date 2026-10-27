import { ResourceModel } from '../models/Resource.model.js';
import type { Resource, ResourceType } from '../types/reservation.js';
export class ResourceService {
  async listResources(
    type?: ResourceType,
    isAvailable?: boolean,
  ): Promise<Resource[]> {
    const resources = await ResourceModel.find({
      ...(type === undefined ? {} : { type }),
      ...(isAvailable === undefined ? {} : { isAvailable }),
    })
      .sort({ id: 1 })
      .lean()
      .exec();
    return resources.map((r): Resource => ({
      id: r.id,
      name: r.name,
      type: r.type,
      location: r.location,
      isAvailable: r.isAvailable,
    }));
  }
}
