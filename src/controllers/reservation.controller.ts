import type { Request, Response } from 'express';
import type { Reservation } from '../types/reservation.js';
import { ReservationService } from '../services/reservation.service.js';
import {
  identifier,
  invalid,
  reservationBody,
} from '../middleware/validation.js';
export class ReservationController {
  constructor(private readonly service: ReservationService) {}
  create = async (
    request: Request<Record<string, string>, Reservation, unknown>,
    response: Response<Reservation>,
  ): Promise<void> => {
    if (!request.is('application/json'))
      invalid('Content-Type must be application/json.');
    response
      .status(201)
      .json(await this.service.create(reservationBody(request.body)));
  };
  listUser = async (
    request: Request,
    response: Response<Reservation[]>,
  ): Promise<void> => {
    response
      .status(200)
      .json(
        await this.service.listUserReservations(
          identifier(request.params.userId),
        ),
      );
  };
}
