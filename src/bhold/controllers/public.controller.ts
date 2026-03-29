import { asyncHandler } from '../../infra/http/middlewares/asyncHandler';
import { listTenantsPublicLoginUseCase } from '../useCases/public/list-tenants-public-login.use-case';

export const publicController = {
	/** GET /public/tenants — id + nome para seleção no login (sem JWT). */
	listTenantsForLogin: asyncHandler(async (_req, res) => {
		const result = await listTenantsPublicLoginUseCase();
		res.setHeader('Cache-Control', 'private, max-age=60');
		res.json(result);
	})
};
