import type { Request, Response } from 'express';
import { ResourceService } from '../services/resource.service.js';
import type { Resource } from '../types/reservation.js';
import { resourceType, availability } from '../middleware/validation.js';
export class ResourceController {
  constructor(private readonly service: ResourceService) {}
  list = async (
    request: Request,
    response: Response<Resource[]>,
  ): Promise<void> => {
    response
      .status(200)
      .json(
        await this.service.listResources(
          resourceType(request.query.type),
          availability(request.query.isAvailable),
        ),
      );
  };
}
