import bcrypt from 'bcrypt';
import { signAccessToken } from '../../auth/jwt';
import { HttpError } from '../../http/HttpError';
import { usuarioRepository } from '../../repositories/usuario.repository';
import { parsePositiveInt, str } from '../../utils/strings';
import { mapUsuarioAuthResponse } from '../usuario/usuario.mapper';

async function resolveLoginUser(email: string, senha: string, tenantIdHintRaw: unknown) {
	const tenantIdHint = parsePositiveInt(tenantIdHintRaw);

	const users = await usuarioRepository.listByEmail(email);
	if (users.length === 0) {
		throw new HttpError(401, 'Credenciais inválidas');
	}

	const matchedActiveUsers: typeof users = [];
	let hasInactiveMatch = false;

	for (const user of users) {
		const ok = await bcrypt.compare(senha, user.senhaHash);
		if (!ok) continue;
		if (!user.ativo) {
			hasInactiveMatch = true;
			continue;
		}
		matchedActiveUsers.push(user);
	}

	if (matchedActiveUsers.length === 0) {
		if (hasInactiveMatch) {
			throw new HttpError(403, 'Usuário inativo');
		}
		throw new HttpError(401, 'Credenciais inválidas');
	}

	const tenantUsers = matchedActiveUsers.filter((user) => user.perfil !== 'SUPER');
	if (tenantUsers.length === 1) {
		return tenantUsers[0];
	}

	if (tenantUsers.length > 1) {
		if (tenantIdHint !== null && Number.isInteger(tenantIdHint) && tenantIdHint > 0) {
			const hintedUser = tenantUsers.find((user) => user.tenantId === tenantIdHint);
			if (hintedUser) {
				return hintedUser;
			}
		}

		throw new HttpError(
			409,
			'Mais de um tenant encontrado para este login. Informe o tenantId apenas se precisar desempatar usuários com o mesmo email e senha.'
		);
	}

	const superUser = matchedActiveUsers.find((user) => user.perfil === 'SUPER');
	if (superUser) {
		return superUser;
	}

	throw new HttpError(401, 'Credenciais inválidas');
}

export async function loginUseCase(body: Record<string, unknown>) {
	const email = str(body.email).toLowerCase();
	const senha = str(body.senha);
	if (!email || !senha) {
		throw new HttpError(400, 'email e senha são obrigatórios');
	}

	const user = await resolveLoginUser(email, senha, body.tenantId);

	const accessToken = signAccessToken({
		sub: user.id,
		tenantId: user.tenantId,
		email: user.email,
		perfil: user.perfil
	});

	const usuario = mapUsuarioAuthResponse(user);

	return {
		accessToken,
		tokenType: 'Bearer' as const,
		usuario,
		user: usuario
	};
}
