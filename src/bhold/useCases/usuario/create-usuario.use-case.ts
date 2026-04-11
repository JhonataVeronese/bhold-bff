import bcrypt from 'bcrypt';
import type { AccessTokenPayload } from '../../auth/jwt';
import { HttpError } from '../../http/HttpError';
import { tenantRepository } from '../../repositories/tenant.repository';
import { usuarioRepository } from '../../repositories/usuario.repository';
import { str } from '../../utils/strings';
import { parseUsuarioPerfil } from './parse-usuario-perfil';
import { mapUsuarioCreated } from './usuario.mapper';

const MAX_USUARIOS_POR_TENANT = 5;

export async function createUsuarioUseCase(auth: AccessTokenPayload, tenantId: number, body: Record<string, unknown>) {
	const tenant = await tenantRepository.findById(tenantId);
	if (!tenant) {
		throw new HttpError(404, 'Tenant não encontrado');
	}

	if (auth.perfil !== 'SUPER') {
		const totalUsuarios = await usuarioRepository.countByTenant(tenantId);
		if (totalUsuarios >= MAX_USUARIOS_POR_TENANT) {
			const message = `Este tenant já atingiu o limite fixo de ${MAX_USUARIOS_POR_TENANT} usuários cadastrados`;
			throw new HttpError(409, message);
		}
	}

	const nome = str(body.nome);
	const email = str(body.email).toLowerCase();
	const senha = str(body.senha);
	if (!nome || !email || !senha) {
		throw new HttpError(400, 'nome, email e senha são obrigatórios');
	}
	if (senha.length < 6) {
		throw new HttpError(400, 'senha deve ter pelo menos 6 caracteres');
	}
	const perfil = parseUsuarioPerfil(body.perfil);
	const senhaHash = await bcrypt.hash(senha, 10);
	const created = await usuarioRepository.create(tenantId, {
		nome,
		email,
		senhaHash,
		perfil
	});
	return mapUsuarioCreated(created);
}
