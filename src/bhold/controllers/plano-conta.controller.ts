import { asyncHandler } from '../../infra/http/middlewares/asyncHandler';
import { getTenantId } from '../http/tenantContext';
import { createGrupoPlanoContaUseCase } from '../useCases/plano-conta/create-grupo-plano-conta.use-case';
import { createPlanoContaUseCase } from '../useCases/plano-conta/create-plano-conta.use-case';
import { deleteGrupoPlanoContaUseCase } from '../useCases/plano-conta/delete-grupo-plano-conta.use-case';
import { deletePlanoContaUseCase } from '../useCases/plano-conta/delete-plano-conta.use-case';
import { getGrupoPlanoContaUseCase } from '../useCases/plano-conta/get-grupo-plano-conta.use-case';
import { getPlanoContaUseCase } from '../useCases/plano-conta/get-plano-conta.use-case';
import { listGruposPlanoContaUseCase } from '../useCases/plano-conta/list-grupos-plano-conta.use-case';
import { listPlanoContasUseCase } from '../useCases/plano-conta/list-plano-contas.use-case';
import { updateGrupoPlanoContaUseCase } from '../useCases/plano-conta/update-grupo-plano-conta.use-case';
import { updatePlanoContaUseCase } from '../useCases/plano-conta/update-plano-conta.use-case';

export const planoContaController = {
	listGrupos: asyncHandler(async (req, res) => {
		const tenantId = getTenantId(req);
		const result = await listGruposPlanoContaUseCase(tenantId);
		res.json(result);
	}),

	createGrupo: asyncHandler(async (req, res) => {
		const tenantId = getTenantId(req);
		const result = await createGrupoPlanoContaUseCase(tenantId, req.body as Record<string, unknown>);
		res.status(201).json(result);
	}),

	getGrupoById: asyncHandler(async (req, res) => {
		const tenantId = getTenantId(req);
		const result = await getGrupoPlanoContaUseCase(tenantId, req.params.id);
		res.json(result);
	}),

	updateGrupo: asyncHandler(async (req, res) => {
		const tenantId = getTenantId(req);
		const result = await updateGrupoPlanoContaUseCase(tenantId, req.params.id, req.body as Record<string, unknown>);
		res.json(result);
	}),

	deleteGrupo: asyncHandler(async (req, res) => {
		const tenantId = getTenantId(req);
		await deleteGrupoPlanoContaUseCase(tenantId, req.params.id);
		res.status(204).send();
	}),

	listContas: asyncHandler(async (req, res) => {
		const tenantId = getTenantId(req);
		const result = await listPlanoContasUseCase(tenantId, req.query as Record<string, unknown>);
		res.json(result);
	}),

	createConta: asyncHandler(async (req, res) => {
		const tenantId = getTenantId(req);
		const result = await createPlanoContaUseCase(tenantId, req.body as Record<string, unknown>);
		res.status(201).json(result);
	}),

	getContaById: asyncHandler(async (req, res) => {
		const tenantId = getTenantId(req);
		const result = await getPlanoContaUseCase(tenantId, req.params.id);
		res.json(result);
	}),

	updateConta: asyncHandler(async (req, res) => {
		const tenantId = getTenantId(req);
		const result = await updatePlanoContaUseCase(tenantId, req.params.id, req.body as Record<string, unknown>);
		res.json(result);
	}),

	deleteConta: asyncHandler(async (req, res) => {
		const tenantId = getTenantId(req);
		await deletePlanoContaUseCase(tenantId, req.params.id);
		res.status(204).send();
	})
};
