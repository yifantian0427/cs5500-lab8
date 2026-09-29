import { Router } from 'express';
import { ReservationController } from '../controllers/reservation.controller.js';
export function createReservationRouter(
  controller: ReservationController,
): Router {
  const router = Router();
  router.get('/resources', controller.listResources);
  router.post('/reservations', controller.create);
  router.get('/reservations/user/:userId', controller.listUser);
  return router;
}
