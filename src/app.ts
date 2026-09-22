import express, { type Express } from 'express';
import { healthRouter } from './routes/health.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

export const app: Express = express();

app.use(express.json());
app.use('/api/v1/health', healthRouter);
app.use(errorHandler);
