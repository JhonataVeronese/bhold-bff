import { NextFunction, Request, Response } from 'express';

/** Rotas permitidas para perfis ADMIN e SUPER. */
export function requireAdminOrSuperMiddleware(req: Request, res: Response, next: NextFunction): void {
	const auth = req.auth;
	if (!auth || (auth.perfil !== 'SUPER' && auth.perfil !== 'ADMIN')) {
		res.status(403).json({ error: 'Acesso restrito a administrador ou super usuário' });
		return;
	}
	next();
}
