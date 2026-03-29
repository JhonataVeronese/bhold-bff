import { Request } from 'express';
import { HttpError } from './HttpError';

/** Rotas protegidas por `requireTenantMiddleware` sempre definem `tenantId`. */
export function getTenantId(req: Request): number {
	const id = req.tenantId;
	if (id === undefined || id === null) {
		throw new HttpError(500, 'Contexto de tenant ausente');
	}
	return id;
}
