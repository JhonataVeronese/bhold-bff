import { Router } from 'express';
import { planoContaController } from '../controllers/plano-conta.controller';

const planoContaRouter = Router();

planoContaRouter.get('/grupos-plano-contas', planoContaController.listGrupos);
planoContaRouter.post('/grupos-plano-contas', planoContaController.createGrupo);
planoContaRouter.get('/grupos-plano-contas/:id', planoContaController.getGrupoById);
planoContaRouter.patch('/grupos-plano-contas/:id', planoContaController.updateGrupo);
planoContaRouter.delete('/grupos-plano-contas/:id', planoContaController.deleteGrupo);

planoContaRouter.get('/plano-contas', planoContaController.listContas);
planoContaRouter.post('/plano-contas', planoContaController.createConta);
planoContaRouter.get('/plano-contas/:id', planoContaController.getContaById);
planoContaRouter.patch('/plano-contas/:id', planoContaController.updateConta);
planoContaRouter.delete('/plano-contas/:id', planoContaController.deleteConta);

export { planoContaRouter };
