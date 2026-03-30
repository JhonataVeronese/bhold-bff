import { Router } from 'express';
import { financeiroExtratoController } from '../controllers/financeiro-extrato.controller';

const financeiroExtratoRouter = Router();

financeiroExtratoRouter.get('/extrato', financeiroExtratoController.extrato);

export { financeiroExtratoRouter };
