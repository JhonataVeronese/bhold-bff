import { Router } from 'express';
import { contaBancariaController } from '../controllers/conta-bancaria.controller';

const contaBancariaRouter = Router();

contaBancariaRouter.get('/', contaBancariaController.list);
contaBancariaRouter.post('/', contaBancariaController.create);

export { contaBancariaRouter };
