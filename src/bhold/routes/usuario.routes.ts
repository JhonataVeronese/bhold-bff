import { Router } from 'express';
import { usuarioController } from '../controllers/usuario.controller';

const usuarioRouter = Router();

usuarioRouter.get('/', usuarioController.list);
usuarioRouter.post('/', usuarioController.create);
usuarioRouter.delete('/:id', usuarioController.delete);

export { usuarioRouter };
