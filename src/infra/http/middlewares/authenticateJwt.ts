import { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../../../bhold/auth/jwt';
import { HttpError } from '../../../bhold/http/HttpError';

/**
 * Exige `Authorization: Bearer <JWT>` válido.
 * Preenche `req.auth` com o payload do token.
 */
export function authenticateJwtMiddleware(req: Request, res: Response, next: NextFunction): void {
	const header = req.headers.authorization;
	if (!header?.startsWith('Bearer ')) {
		res.status(401).json({ error: 'Authorization Bearer com JWT é obrigatório' });
		return;
	}
	const token = header.slice(7).trim();
	if (!token) {
		res.status(401).json({ error: 'Token ausente' });
		return;
	}
	try {
		req.auth = verifyAccessToken(token);
		next();
	} catch (e) {
		if (e instanceof HttpError) {
			res.status(e.status).json({ error: e.message });
			return;
		}
		res.status(401).json({ error: 'Token inválido ou expirado' });
	}
}
