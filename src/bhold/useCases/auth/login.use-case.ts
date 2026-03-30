import bcrypt from 'bcrypt';
import { signAccessToken } from '../../auth/jwt';
import { HttpError } from '../../http/HttpError';
import { usuarioRepository } from '../../repositories/usuario.repository';
import { parsePositiveInt, str } from '../../utils/strings';
import { mapUsuarioAuthResponse } from '../usuario/usuario.mapper';

export async function loginUseCase(body: Record<string, unknown>) {
	const email = str(body.email).toLowerCase();
	const senha = str(body.senha);
	if (!email || !senha) {
		throw new HttpError(400, 'email e senha são obrigatórios');
	}

	const tenantIdFromBody = parsePositiveInt(body.tenantId);

	const user =
		tenantIdFromBody !== null
			? await usuarioRepository.findByTenantAndEmail(tenantIdFromBody, email)
			: await usuarioRepository.findSuperUserByEmail(email);

	if (!user && tenantIdFromBody === null) {
		const existeOutroPerfil = await usuarioRepository.findFirstByEmail(email);
		if (existeOutroPerfil && existeOutroPerfil.perfil !== 'SUPER') {
			throw new HttpError(
				400,
				'Informe tenantId no corpo do login (número do tenant onde o usuário foi cadastrado). Usuários super não precisam deste campo.'
			);
		}
	}

	if (!user) {
		throw new HttpError(401, 'Credenciais inválidas');
	}
	if (!user.ativo) {
		throw new HttpError(403, 'Usuário inativo');
	}

	const ok = await bcrypt.compare(senha, user.senhaHash);
	if (!ok) {
		throw new HttpError(401, 'Credenciais inválidas');
	}

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
