import { Router } from 'express';
import { formaPagamentoController } from '../controllers/forma-pagamento.controller';

const formaPagamentoRouter = Router();

formaPagamentoRouter.get('/', formaPagamentoController.list);
formaPagamentoRouter.post('/', formaPagamentoController.create);
formaPagamentoRouter.get('/:id', formaPagamentoController.getById);
formaPagamentoRouter.patch('/:id', formaPagamentoController.update);
formaPagamentoRouter.delete('/:id', formaPagamentoController.delete);

export { formaPagamentoRouter };
