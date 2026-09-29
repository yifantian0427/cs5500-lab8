import type { Request, Response } from 'express';
import type { Reservation, Resource } from '../types/reservation.js';
import { ReservationService } from '../services/reservation.service.js';
import {
  identifier,
  invalid,
  reservationBody,
  resourceType,
} from '../middleware/validation.js';
export class ReservationController {
  constructor(private readonly service: ReservationService) {}
  listResources = (request: Request, response: Response<Resource[]>): void => {
    response
      .status(200)
      .json(this.service.listResources(resourceType(request.query.type)));
  };
  create = (
    request: Request<Record<string, string>, Reservation, unknown>,
    response: Response<Reservation>,
  ): void => {
    if (!request.is('application/json'))
      invalid('Content-Type must be application/json.');
    response
      .status(201)
      .json(this.service.create(reservationBody(request.body)));
  };
  listUser = (request: Request, response: Response<Reservation[]>): void => {
    response
      .status(200)
      .json(
        this.service.listUserReservations(identifier(request.params.userId)),
      );
  };
}
