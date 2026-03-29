import { NextFunction, Request, Response } from 'express';

/** Rotas exclusivas do perfil SUPER (cadastro global de tenants e usuários). */
export function requireSuperMiddleware(req: Request, res: Response, next: NextFunction): void {
	const auth = req.auth;
	if (!auth || auth.perfil !== 'SUPER') {
		res.status(403).json({ error: 'Acesso restrito a super usuário' });
		return;
	}
	next();
}
