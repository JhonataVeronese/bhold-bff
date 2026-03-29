import { Router } from 'express';
import { tenantController } from '../controllers/tenant.controller';

const tenantRouter = Router();

tenantRouter.get('/', tenantController.list);
tenantRouter.post('/', tenantController.create);
tenantRouter.get('/:id', tenantController.getById);
tenantRouter.patch('/:id', tenantController.update);
tenantRouter.delete('/:id', tenantController.remove);

export { tenantRouter };
