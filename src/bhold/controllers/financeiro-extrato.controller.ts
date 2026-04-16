import { asyncHandler } from '../../infra/http/middlewares/asyncHandler';
import { getTenantId } from '../http/tenantContext';
import { getExtratoFinanceiroUseCase } from '../useCases/financeiro/get-extrato-financeiro.use-case';
import { getResumoBancosFinanceiroUseCase } from '../useCases/financeiro/get-resumo-bancos-financeiro.use-case';
import { getResumoPeriodoFinanceiroUseCase } from '../useCases/financeiro/get-resumo-periodo-financeiro.use-case';

export const financeiroExtratoController = {
	extrato: asyncHandler(async (req, res) => {
		const tenantId = getTenantId(req);
		const result = await getExtratoFinanceiroUseCase(tenantId, req.query as Record<string, unknown>);
		res.json(result);
	}),

	resumoPeriodo: asyncHandler(async (req, res) => {
		const tenantId = getTenantId(req);
		const result = await getResumoPeriodoFinanceiroUseCase(tenantId, req.query as Record<string, unknown>);
		res.json(result);
	}),

	resumoBancos: asyncHandler(async (req, res) => {
		const tenantId = getTenantId(req);
		const result = await getResumoBancosFinanceiroUseCase(tenantId, req.query as Record<string, unknown>);
		res.json(result);
	})
};
