import { Router } from 'express';
import { publicController } from '../controllers/public.controller';

const publicRouter = Router();

publicRouter.get('/tenants', publicController.listTenantsForLogin);

export { publicRouter };
