import { asyncHandler } from '../../infra/http/middlewares/asyncHandler';
import { getTenantId } from '../http/tenantContext';
import { getExtratoFinanceiroUseCase } from '../useCases/financeiro/get-extrato-financeiro.use-case';

export const financeiroExtratoController = {
	extrato: asyncHandler(async (req, res) => {
		const tenantId = getTenantId(req);
		const result = await getExtratoFinanceiroUseCase(tenantId, req.query as Record<string, unknown>);
		res.json(result);
	})
};
