import { asyncHandler } from '../../infra/http/middlewares/asyncHandler';
import { getTenantId } from '../http/tenantContext';
import { createClienteUseCase } from '../useCases/cliente/create-cliente.use-case';
import { listClientesUseCase } from '../useCases/cliente/list-clientes.use-case';

export const clienteController = {
	list: asyncHandler(async (req, res) => {
		const tenantId = getTenantId(req);
		const result = await listClientesUseCase(tenantId);
		res.json(result);
	}),

	create: asyncHandler(async (req, res) => {
		const tenantId = getTenantId(req);
		const result = await createClienteUseCase(tenantId, req.body as Record<string, unknown>);
		res.status(201).json(result);
	})
};
