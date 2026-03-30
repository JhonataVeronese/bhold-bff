import { asyncHandler } from '../../infra/http/middlewares/asyncHandler';
import { getTenantId } from '../http/tenantContext';
import { createClienteUseCase } from '../useCases/cliente/create-cliente.use-case';
import { deleteClienteUseCase } from '../useCases/cliente/delete-cliente.use-case';
import { getClienteByIdUseCase } from '../useCases/cliente/get-cliente-by-id.use-case';
import { listClientesUseCase } from '../useCases/cliente/list-clientes.use-case';
import { updateClienteUseCase } from '../useCases/cliente/update-cliente.use-case';

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
	}),

	getById: asyncHandler(async (req, res) => {
		const tenantId = getTenantId(req);
		const result = await getClienteByIdUseCase(tenantId, req.params.id);
		res.json(result);
	}),

	update: asyncHandler(async (req, res) => {
		const tenantId = getTenantId(req);
		const result = await updateClienteUseCase(tenantId, req.params.id, req.body as Record<string, unknown>);
		res.json(result);
	}),

	delete: asyncHandler(async (req, res) => {
		const tenantId = getTenantId(req);
		await deleteClienteUseCase(tenantId, req.params.id);
		res.status(204).send();
	})
};
