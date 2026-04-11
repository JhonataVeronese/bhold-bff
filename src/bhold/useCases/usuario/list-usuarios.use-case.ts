import type { AccessTokenPayload } from '../../auth/jwt';
import { usuarioRepository } from '../../repositories/usuario.repository';
import { mapUsuarioListItem } from './usuario.mapper';

/** SUPER vê todos; ADMIN vê apenas usuários do próprio tenant. */
export async function listUsuariosUseCase(auth: AccessTokenPayload) {
	const rows =
		auth.perfil === 'SUPER' ? await usuarioRepository.listAll() : await usuarioRepository.listByTenant(auth.tenantId);
	return { data: rows.map(mapUsuarioListItem) };
}
