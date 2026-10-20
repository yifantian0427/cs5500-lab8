import { Router } from 'express';
import type { ResourceController } from '../controllers/resource.controller.js';
export function createResourceRouter(controller: ResourceController): Router {
  const router = Router();
  router.get('/resources', controller.list);
  return router;
}
