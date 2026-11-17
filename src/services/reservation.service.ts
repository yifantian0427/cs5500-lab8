import { randomUUID } from 'node:crypto';
import { ResourceModel } from '../models/Resource.model.js';
import { ReservationModel } from '../models/Reservation.model.js';
import type {
  CreateReservationRequest,
  Reservation,
} from '../types/reservation.js';
import { ApiError } from './errors.js';
export class ReservationService {
  async listUserReservations(userId: string): Promise<Reservation[]> {
    const records = await ReservationModel.find({
      userId,
    })
      .sort({ _id: 1 })
      .lean()
      .exec();
    const resources = await ResourceModel.find({
      _id: { $in: records.map((r) => r.resourceId) },
    })
      .lean()
      .exec();
    const publicIds = new Map(resources.map((r) => [r._id.toString(), r.id]));
    return records.map((r): Reservation => {
      const resourceId = publicIds.get(r.resourceId.toString());
      if (!resourceId)
        throw new Error('Reservation has a missing resource reference.');
      return {
        id: r.id,
        resourceId,
        userId: r.userId,
        startTime: r.startTimeText,
        endTime: r.endTimeText,
        status: r.status,
      };
    });
  }
  async cancel(id: string): Promise<Reservation> {
    const record = await ReservationModel.findOneAndUpdate(
      { id },
      { $set: { status: 'CANCELLED' } },
      { new: true, runValidators: true },
    ).exec();
    if (!record)
      throw new ApiError(
        400,
        'RESERVATION_NOT_FOUND',
        'Reservation does not exist.',
      );
    const resource = await ResourceModel.findById(record.resourceId)
      .lean()
      .exec();
    if (!resource)
      throw new Error('Reservation has a missing resource reference.');
    return {
      id: record.id,
      resourceId: resource.id,
      userId: record.userId,
      startTime: record.startTimeText,
      endTime: record.endTimeText,
      status: record.status,
    };
  }
  async create(input: CreateReservationRequest): Promise<Reservation> {
    const startTime = new Date(input.startTime),
      endTime = new Date(input.endTime);
    if (!(startTime < endTime))
      throw new ApiError(
        400,
        'VALIDATION_ERROR',
        'startTime must be before endTime.',
      );
    // Every booking writes the same resource document before checking overlaps.
    // Concurrent transactions conflict and retry with a fresh snapshot, preventing
    // two callers from both passing the overlap check. Requires a replica set.
    const result = await ResourceModel.db.transaction(
      async (session): Promise<Reservation> => {
        const resource = await ResourceModel.findOneAndUpdate(
          { id: input.resourceId },
          { $inc: { bookingVersion: 1 } },
          { new: true, session },
        ).exec();
        if (!resource)
          throw new ApiError(
            400,
            'RESOURCE_NOT_FOUND',
            'Resource does not exist.',
          );
        if (!resource.isAvailable)
          throw new ApiError(
            400,
            'RESOURCE_UNAVAILABLE',
            'Resource is unavailable.',
          );
        const conflict = await ReservationModel.exists({
          resourceId: resource._id,
          status: { $in: ['PENDING', 'CONFIRMED'] },
          startTime: { $lt: endTime },
          endTime: { $gt: startTime },
        }).session(session);
        if (conflict)
          throw new ApiError(
            409,
            'DOUBLE_BOOKING',
            'Resource is already reserved for this time slot.',
          );
        const id = randomUUID();
        await ReservationModel.create(
          [
            {
              id,
              resourceId: resource._id,
              userId: input.userId,
              startTime,
              endTime,
              startTimeText: input.startTime,
              endTimeText: input.endTime,
              status: 'CONFIRMED',
            },
          ],
          { session },
        );
        return { ...input, id, status: 'CONFIRMED' };
      },
    );
    if (!result) throw new Error('Transaction returned no reservation.');
    return result;
  }
}
