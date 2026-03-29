import jwt from 'jsonwebtoken';
import type { UsuarioPerfil } from '@prisma/client';
import { HttpError } from '../http/HttpError';

export type AccessTokenPayload = {
	sub: number;
	tenantId: number;
	email: string;
	perfil: UsuarioPerfil;
};

function getSecret(): string {
	const s = process.env.JWT_SECRET;
	if (!s || s.length < 16) {
		throw new HttpError(500, 'JWT_SECRET deve ter ao menos 16 caracteres (defina no .env)');
	}
	return s;
}

export function signAccessToken(payload: AccessTokenPayload): string {
	return jwt.sign(
		{
			sub: payload.sub,
			tenantId: payload.tenantId,
			email: payload.email,
			perfil: payload.perfil
		},
		getSecret(),
		{
			expiresIn: process.env.JWT_EXPIRES_IN ?? '8h',
			issuer: 'bholder-bff'
		}
	);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
	let secret: string;
	try {
		secret = getSecret();
	} catch (e) {
		if (e instanceof HttpError) throw e;
		throw new HttpError(500, 'Configuração JWT inválida');
	}

	let decoded: jwt.JwtPayload & {
		sub?: unknown;
		tenantId?: unknown;
		email?: unknown;
		perfil?: unknown;
	};
	try {
		decoded = jwt.verify(token, secret, { issuer: 'bholder-bff' }) as typeof decoded;
	} catch {
		throw new HttpError(401, 'Token inválido ou expirado');
	}
	const subRaw = decoded.sub;
	const sub = typeof subRaw === 'number' ? subRaw : parseInt(String(subRaw), 10);
	const tenantRaw = decoded.tenantId;
	const tenantId = typeof tenantRaw === 'number' ? tenantRaw : parseInt(String(tenantRaw), 10);
	const email = typeof decoded.email === 'string' ? decoded.email : '';
	const perfil = decoded.perfil as UsuarioPerfil;
	if (!Number.isInteger(sub) || sub < 1 || !Number.isInteger(tenantId) || tenantId < 1 || !email) {
		throw new HttpError(401, 'Token inválido ou expirado');
	}
	return { sub, tenantId, email, perfil };
}
