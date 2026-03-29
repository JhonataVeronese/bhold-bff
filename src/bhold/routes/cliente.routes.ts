import { Router } from 'express';
import { clienteController } from '../controllers/cliente.controller';

const clienteRouter = Router();

clienteRouter.get('/', clienteController.list);
clienteRouter.post('/', clienteController.create);

export { clienteRouter };
