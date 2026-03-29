import { asyncHandler } from '../../infra/http/middlewares/asyncHandler';
import { createTenantUseCase } from '../useCases/tenant/create-tenant.use-case';
import { deleteTenantUseCase } from '../useCases/tenant/delete-tenant.use-case';
import { getTenantByIdUseCase } from '../useCases/tenant/get-tenant.use-case';
import { listTenantsUseCase } from '../useCases/tenant/list-tenants.use-case';
import { updateTenantUseCase } from '../useCases/tenant/update-tenant.use-case';

export const tenantController = {
	list: asyncHandler(async (_req, res) => {
		const result = await listTenantsUseCase();
		res.json(result);
	}),

	create: asyncHandler(async (req, res) => {
		const result = await createTenantUseCase(req.body as Record<string, unknown>);
		res.status(201).json(result);
	}),

	getById: asyncHandler(async (req, res) => {
		const result = await getTenantByIdUseCase(req.params.id);
		res.json(result);
	}),

	update: asyncHandler(async (req, res) => {
		const result = await updateTenantUseCase(req.params.id, req.body as Record<string, unknown>);
		res.json(result);
	}),

	remove: asyncHandler(async (req, res) => {
		await deleteTenantUseCase(req.params.id);
		res.status(204).send();
	})
};
