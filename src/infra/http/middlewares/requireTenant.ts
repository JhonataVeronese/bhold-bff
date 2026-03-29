import { NextFunction, Request, Response } from 'express';
import { tenantRepository } from '../../../bhold/repositories/tenant.repository';
import { parsePositiveInt } from '../../../bhold/utils/strings';

/**
 * Exige `X-Tenant-Id` com tenant existente.
 * Usuário comum: header deve coincidir com `tenantId` do JWT.
 * SUPER: pode operar em qualquer tenant (header define o escopo).
 */
export function requireTenantMiddleware(req: Request, res: Response, next: NextFunction): void {
	const auth = req.auth;
	if (!auth) {
		res.status(401).json({ error: 'Não autenticado' });
		return;
	}

	const raw = req.headers['x-tenant-id'];
	const rawStr = (Array.isArray(raw) ? raw[0] : raw)?.trim();
	if (!rawStr) {
		res.status(400).json({ error: 'Header X-Tenant-Id é obrigatório' });
		return;
	}
	const id = parsePositiveInt(rawStr);
	if (id === null) {
		res.status(400).json({ error: 'Header X-Tenant-Id deve ser um id numérico válido' });
		return;
	}

	if (auth.perfil !== 'SUPER' && auth.tenantId !== id) {
		res.status(403).json({ error: 'Tenant não autorizado para este usuário' });
		return;
	}

	tenantRepository
		.findById(id)
		.then((tenant) => {
			if (!tenant) {
				res.status(404).json({ error: 'Tenant não encontrado' });
				return;
			}
			req.tenantId = tenant.id;
			req.tenant = tenant;
			next();
		})
		.catch(next);
}
