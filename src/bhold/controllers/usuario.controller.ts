import { asyncHandler } from '../../infra/http/middlewares/asyncHandler';
import { HttpError } from '../http/HttpError';
import { resolveTenantIdForUsuarioCreate } from '../http/resolveUsuarioTenant';
import { createUsuarioUseCase } from '../useCases/usuario/create-usuario.use-case';
import { deleteUsuarioUseCase } from '../useCases/usuario/delete-usuario.use-case';
import { listUsuariosUseCase } from '../useCases/usuario/list-usuarios.use-case';

export const usuarioController = {
	list: asyncHandler(async (_req, res) => {
		const result = await listUsuariosUseCase();
		res.json(result);
	}),

	create: asyncHandler(async (req, res) => {
		const tenantId = resolveTenantIdForUsuarioCreate(req, req.body as Record<string, unknown>);
		const result = await createUsuarioUseCase(tenantId, req.body as Record<string, unknown>);
		res.status(201).json(result);
	}),

	delete: asyncHandler(async (req, res) => {
		const auth = req.auth;
		if (!auth) {
			throw new HttpError(401, 'Não autenticado');
		}
		await deleteUsuarioUseCase(auth.sub, req.params.id);
		res.status(204).send();
	})
};
