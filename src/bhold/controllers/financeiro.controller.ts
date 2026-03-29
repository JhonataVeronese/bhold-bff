import { asyncHandler } from '../../infra/http/middlewares/asyncHandler';
import { getTenantId } from '../http/tenantContext';
import { createLancamentoUseCase } from '../useCases/financeiro/create-lancamento.use-case';
import { getDashboardFinanceiroUseCase } from '../useCases/financeiro/get-dashboard-financeiro.use-case';
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

	listContasAReceber: asyncHandler(async (req, res) => {
		const tenantId = getTenantId(req);
		const result = await listLancamentosByTypeUseCase(tenantId, 'RECEIVABLE');
		res.json(result);
	}),

	createContaAReceber: asyncHandler(async (req, res) => {
		const tenantId = getTenantId(req);
		const result = await createLancamentoUseCase(tenantId, req.body as Record<string, unknown>, 'RECEIVABLE');
		res.status(201).json(result);
	})
};
