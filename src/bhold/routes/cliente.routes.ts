import { Router } from 'express';
import { clienteController } from '../controllers/cliente.controller';

const clienteRouter = Router();

clienteRouter.get('/', clienteController.list);
clienteRouter.post('/', clienteController.create);
clienteRouter.get('/:id', clienteController.getById);
clienteRouter.patch('/:id', clienteController.update);
clienteRouter.delete('/:id', clienteController.delete);

export { clienteRouter };
