import { Router } from 'express';
import { financeiroExtratoController } from '../controllers/financeiro-extrato.controller';

const financeiroExtratoRouter = Router();

financeiroExtratoRouter.get('/extrato', financeiroExtratoController.extrato);
financeiroExtratoRouter.get('/resumo-periodo', financeiroExtratoController.resumoPeriodo);

export { financeiroExtratoRouter };
