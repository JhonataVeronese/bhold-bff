import { asyncHandler } from '../../infra/http/middlewares/asyncHandler';
import { getTenantId } from '../http/tenantContext';
import { createFornecedorUseCase } from '../useCases/fornecedor/create-fornecedor.use-case';
import { listFornecedoresUseCase } from '../useCases/fornecedor/list-fornecedores.use-case';

export const fornecedorController = {
	list: asyncHandler(async (req, res) => {
		const tenantId = getTenantId(req);
		const result = await listFornecedoresUseCase(tenantId);
		res.json(result);
	}),

	create: asyncHandler(async (req, res) => {
		const tenantId = getTenantId(req);
		const result = await createFornecedorUseCase(tenantId, req.body as Record<string, unknown>);
		res.status(201).json(result);
	})
};
