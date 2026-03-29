import { Router } from 'express';
import { financeiroController } from '../controllers/financeiro.controller';

const financeiroRouter = Router();

financeiroRouter.get('/dashboard', financeiroController.dashboard);

financeiroRouter.get('/lancamentos-financeiros', financeiroController.listLancamentos);
financeiroRouter.post('/lancamentos-financeiros', financeiroController.createLancamento);

financeiroRouter.get('/contas-a-pagar', financeiroController.listContasAPagar);
financeiroRouter.post('/contas-a-pagar', financeiroController.createContaAPagar);

financeiroRouter.get('/contas-a-receber', financeiroController.listContasAReceber);
financeiroRouter.post('/contas-a-receber', financeiroController.createContaAReceber);

export { financeiroRouter };
