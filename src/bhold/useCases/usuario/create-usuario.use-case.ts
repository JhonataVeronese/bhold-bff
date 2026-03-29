import bcrypt from 'bcrypt';
import { HttpError } from '../../http/HttpError';
import { tenantRepository } from '../../repositories/tenant.repository';
import { usuarioRepository } from '../../repositories/usuario.repository';
import { str } from '../../utils/strings';
import { parseUsuarioPerfil } from './parse-usuario-perfil';
import { mapUsuarioCreated } from './usuario.mapper';

export async function createUsuarioUseCase(tenantId: number, body: Record<string, unknown>) {
	const tenant = await tenantRepository.findById(tenantId);
	if (!tenant) {
		throw new HttpError(404, 'Tenant não encontrado');
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
