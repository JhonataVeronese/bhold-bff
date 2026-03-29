import type { Request } from 'express';
import { HttpError } from './HttpError';
import { parsePositiveInt } from '../utils/strings';

/**
 * Cadastro de usuário (admin): tenant definido apenas no JSON — sem X-Tenant-Id nem query.
 */
export function resolveTenantIdForUsuarioCreate(_req: Request, body: Record<string, unknown>): number {
	const id = parsePositiveInt(body.tenantId);
	if (id === null) {
		throw new HttpError(400, 'tenantId é obrigatório no corpo da requisição');
	}
	return id;
}
