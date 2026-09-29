import express, { type Express } from 'express';
import { ReservationService } from './services/reservation.service.js';
import { ReservationController } from './controllers/reservation.controller.js';
import { createReservationRouter } from './routes/reservation.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
export function createApp(
  service: ReservationService = new ReservationService(),
): Express {
  const app = express();
  app.use(express.json());
  app.use(
    '/api/v1',
    createReservationRouter(new ReservationController(service)),
  );
  app.use(errorHandler);
  return app;
}
export const app: Express = createApp();
