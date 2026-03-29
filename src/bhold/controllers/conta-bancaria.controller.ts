import { asyncHandler } from '../../infra/http/middlewares/asyncHandler';
import { getTenantId } from '../http/tenantContext';
import { createContaBancariaUseCase } from '../useCases/conta-bancaria/create-conta-bancaria.use-case';
import { listContasBancariasUseCase } from '../useCases/conta-bancaria/list-contas-bancarias.use-case';

export const contaBancariaController = {
	list: asyncHandler(async (req, res) => {
		const tenantId = getTenantId(req);
		const result = await listContasBancariasUseCase(tenantId);
		res.json(result);
	}),

	create: asyncHandler(async (req, res) => {
		const tenantId = getTenantId(req);
		const result = await createContaBancariaUseCase(tenantId, req.body as Record<string, unknown>);
		res.status(201).json(result);
	})
};
