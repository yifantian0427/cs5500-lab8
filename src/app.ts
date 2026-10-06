import express, { type Express } from 'express';
import { ReservationService } from './services/reservation.service.js';
import { ResourceService } from './services/resource.service.js';
import { ReservationController } from './controllers/reservation.controller.js';
import { ResourceController } from './controllers/resource.controller.js';
import { createReservationRouter } from './routes/reservation.routes.js';
import { createResourceRouter } from './routes/resource.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { connectDatabase } from './config/database.js';
import { loadEnvironment } from './config/environment.js';
export function createApp(
  service: ReservationService = new ReservationService(),
  resources: ResourceService = new ResourceService(),
): Express {
  const app = express();
  app.use(express.json());
  app.use('/api/v1', createResourceRouter(new ResourceController(resources)));
  app.use(
    '/api/v1',
    createReservationRouter(new ReservationController(service)),
  );
  // Express 5 forwards rejected async handlers to this error middleware.
  app.use(errorHandler);
  return app;
}
export async function initializeApp(): Promise<Express> {
  await connectDatabase(loadEnvironment().mongoUri);
  return createApp();
}
export const app: Express = createApp();
