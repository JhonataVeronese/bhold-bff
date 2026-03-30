import { asyncHandler } from '../../infra/http/middlewares/asyncHandler';
import { getTenantId } from '../http/tenantContext';
import { createLancamentoUseCase } from '../useCases/financeiro/create-lancamento.use-case';
import { deleteLancamentoFinanceiroUseCase } from '../useCases/financeiro/delete-lancamento-financeiro.use-case';
import { efetivarPagamentoLancamentoUseCase } from '../useCases/financeiro/efetivar-pagamento-lancamento.use-case';
import { getDashboardFinanceiroUseCase } from '../useCases/financeiro/get-dashboard-financeiro.use-case';
import { getLancamentoFinanceiroByIdUseCase } from '../useCases/financeiro/get-lancamento-financeiro-by-id.use-case';
import { listLancamentosByTypeUseCase, listLancamentosUseCase } from '../useCases/financeiro/list-lancamentos.use-case';

export const financeiroController = {
	dashboard: asyncHandler(async (req, res) => {
		const tenantId = getTenantId(req);
		const result = await getDashboardFinanceiroUseCase(tenantId, req.query as Record<string, unknown>);
		res.json(result);
	}),

	listLancamentos: asyncHandler(async (req, res) => {
		const tenantId = getTenantId(req);
		const result = await listLancamentosUseCase(tenantId, req.query as Record<string, unknown>);
		res.json(result);
	}),

	createLancamento: asyncHandler(async (req, res) => {
		const tenantId = getTenantId(req);
		const result = await createLancamentoUseCase(tenantId, req.body as Record<string, unknown>);
		res.status(201).json(result);
	}),

	listContasAPagar: asyncHandler(async (req, res) => {
		const tenantId = getTenantId(req);
		const result = await listLancamentosByTypeUseCase(tenantId, 'PAYABLE');
		res.json(result);
	}),

	createContaAPagar: asyncHandler(async (req, res) => {
		const tenantId = getTenantId(req);
		const result = await createLancamentoUseCase(tenantId, req.body as Record<string, unknown>, 'PAYABLE');
		res.status(201).json(result);
	}),

	getContaAPagarById: asyncHandler(async (req, res) => {
		const tenantId = getTenantId(req);
		const result = await getLancamentoFinanceiroByIdUseCase(tenantId, req.params.id, 'PAYABLE');
		res.json(result);
	}),

	listContasAReceber: asyncHandler(async (req, res) => {
		const tenantId = getTenantId(req);
		const result = await listLancamentosByTypeUseCase(tenantId, 'RECEIVABLE');
		res.json(result);
	}),

	createContaAReceber: asyncHandler(async (req, res) => {
		const tenantId = getTenantId(req);
		const result = await createLancamentoUseCase(tenantId, req.body as Record<string, unknown>, 'RECEIVABLE');
		res.status(201).json(result);
	}),

	getContaAReceberById: asyncHandler(async (req, res) => {
		const tenantId = getTenantId(req);
		const result = await getLancamentoFinanceiroByIdUseCase(tenantId, req.params.id, 'RECEIVABLE');
		res.json(result);
	}),

	efetivarPagamentoContaAPagar: asyncHandler(async (req, res) => {
		const tenantId = getTenantId(req);
		const result = await efetivarPagamentoLancamentoUseCase(
			tenantId,
			req.params.id,
			'PAYABLE',
			req.body as Record<string, unknown>
		);
		res.json(result);
	}),

	efetivarPagamentoContaAReceber: asyncHandler(async (req, res) => {
		const tenantId = getTenantId(req);
		const result = await efetivarPagamentoLancamentoUseCase(
			tenantId,
			req.params.id,
			'RECEIVABLE',
			req.body as Record<string, unknown>
		);
		res.json(result);
	}),

	deleteContaAPagar: asyncHandler(async (req, res) => {
		const tenantId = getTenantId(req);
		await deleteLancamentoFinanceiroUseCase(tenantId, req.params.id, 'PAYABLE');
		res.status(204).send();
	}),

	deleteContaAReceber: asyncHandler(async (req, res) => {
		const tenantId = getTenantId(req);
		await deleteLancamentoFinanceiroUseCase(tenantId, req.params.id, 'RECEIVABLE');
		res.status(204).send();
	})
};
