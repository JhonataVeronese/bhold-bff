import { asyncHandler } from '../../infra/http/middlewares/asyncHandler';
import { loginUseCase } from '../useCases/auth/login.use-case';

export const authController = {
	login: asyncHandler(async (req, res) => {
		const result = await loginUseCase(req.body as Record<string, unknown>);
		res.json(result);
	})
};
