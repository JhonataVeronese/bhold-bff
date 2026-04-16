import { asyncHandler } from '../../infra/http/middlewares/asyncHandler';
import { getTenantId } from '../http/tenantContext';
import { createFormaPagamentoUseCase } from '../useCases/forma-pagamento/create-forma-pagamento.use-case';
import { deleteFormaPagamentoUseCase } from '../useCases/forma-pagamento/delete-forma-pagamento.use-case';
import { getFormaPagamentoUseCase } from '../useCases/forma-pagamento/get-forma-pagamento.use-case';
import { listFormasPagamentoUseCase } from '../useCases/forma-pagamento/list-formas-pagamento.use-case';
import { updateFormaPagamentoUseCase } from '../useCases/forma-pagamento/update-forma-pagamento.use-case';

export const formaPagamentoController = {
	list: asyncHandler(async (req, res) => {
		const tenantId = getTenantId(req);
		const result = await listFormasPagamentoUseCase(tenantId);
		res.json(result);
	}),

	create: asyncHandler(async (req, res) => {
		const tenantId = getTenantId(req);
		const result = await createFormaPagamentoUseCase(tenantId, req.body as Record<string, unknown>);
		res.status(201).json(result);
	}),

	getById: asyncHandler(async (req, res) => {
		const tenantId = getTenantId(req);
		const result = await getFormaPagamentoUseCase(tenantId, req.params.id);
		res.json(result);
	}),

	update: asyncHandler(async (req, res) => {
		const tenantId = getTenantId(req);
		const result = await updateFormaPagamentoUseCase(tenantId, req.params.id, req.body as Record<string, unknown>);
		res.json(result);
	}),

	delete: asyncHandler(async (req, res) => {
		const tenantId = getTenantId(req);
		await deleteFormaPagamentoUseCase(tenantId, req.params.id);
		res.status(204).send();
	})
};
