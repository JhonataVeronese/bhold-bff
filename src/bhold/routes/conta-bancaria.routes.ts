import { Router } from 'express';
import { contaBancariaController } from '../controllers/conta-bancaria.controller';

const contaBancariaRouter = Router();

contaBancariaRouter.get('/empresa', contaBancariaController.listEmpresa);
contaBancariaRouter.post('/empresa', contaBancariaController.createEmpresa);
contaBancariaRouter.delete('/empresa/:id', contaBancariaController.deleteEmpresa);

contaBancariaRouter.get('/terceiros', contaBancariaController.listTerceiros);
contaBancariaRouter.post('/terceiros', contaBancariaController.createTerceiro);
contaBancariaRouter.delete('/terceiros/:id', contaBancariaController.deleteTerceiro);

export { contaBancariaRouter };
