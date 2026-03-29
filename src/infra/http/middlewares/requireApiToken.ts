import { timingSafeEqual } from 'crypto';
import { NextFunction, Request, Response } from 'express';

function safeCompare(a: string, b: string): boolean {
	try {
		const bufA = Buffer.from(a, 'utf8');
		const bufB = Buffer.from(b, 'utf8');
		if (bufA.length !== bufB.length) {
			return false;
		}
		return timingSafeEqual(bufA, bufB);
	} catch {
		return false;
	}
}

/**
 * Camada extra: o cliente deve enviar o mesmo valor de `BHOLD_API_TOKEN` no header
 * `X-BHOLD-API-Token` (comparação em tempo constante).
 *
 * - Em **produção** (`NODE_ENV=production`), `BHOLD_API_TOKEN` é obrigatório no servidor.
 * - Fora de produção, se a variável não estiver definida, o middleware não exige o header (dev local).
 */
export function requireApiTokenMiddleware(req: Request, res: Response, next: NextFunction): void {
	const expected = process.env.BHOLD_API_TOKEN?.trim();
	const isProd = process.env.NODE_ENV === 'production';

	if (!expected) {
		if (isProd) {
			res.status(503).json({ error: 'BHOLD_API_TOKEN não configurado no servidor' });
			return;
		}
		next();
		return;
	}

	const raw = req.headers['x-bhold-api-token'];
	const sent = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? '';

	if (!safeCompare(sent, expected)) {
		res.status(401).json({
			error:
				'Token da API inválido ou ausente. Envie o header X-BHOLD-API-Token com o valor configurado em BHOLD_API_TOKEN.'
		});
		return;
	}

	next();
}
