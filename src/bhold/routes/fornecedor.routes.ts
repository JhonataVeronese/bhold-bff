import { Router } from 'express';
import { fornecedorController } from '../controllers/fornecedor.controller';

const fornecedorRouter = Router();

fornecedorRouter.get('/', fornecedorController.list);
fornecedorRouter.post('/', fornecedorController.create);

export { fornecedorRouter };
