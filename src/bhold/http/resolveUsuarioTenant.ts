import type { Request } from 'express';
import { HttpError } from './HttpError';
import { parsePositiveInt } from '../utils/strings';

/**
 * Cadastro de usuário:
 * - SUPER escolhe o tenant via JSON
 * - ADMIN sempre usa o tenant do próprio JWT
 */
export function resolveTenantIdForUsuarioCreate(req: Request, body: Record<string, unknown>): number {
	const auth = req.auth;
	if (!auth) {
		throw new HttpError(401, 'Não autenticado');
	}

	if (auth.perfil !== 'SUPER') {
		const bodyTenantId = parsePositiveInt(body.tenantId);
		if (bodyTenantId !== null && bodyTenantId !== auth.tenantId) {
			throw new HttpError(403, 'tenantId informado não corresponde ao tenant do usuário logado');
		}
		return auth.tenantId;
	}

	const id = parsePositiveInt(body.tenantId);
	if (id === null) {
		throw new HttpError(400, 'tenantId é obrigatório no corpo da requisição');
	}
	return id;
}
