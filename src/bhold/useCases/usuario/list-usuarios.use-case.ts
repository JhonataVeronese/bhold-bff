import { usuarioRepository } from '../../repositories/usuario.repository';
import { mapUsuarioListItem } from './usuario.mapper';

/** Listagem global (admin): todos os usuários, com dados do tenant. */
export async function listUsuariosUseCase() {
	const rows = await usuarioRepository.listAll();
	return { data: rows.map(mapUsuarioListItem) };
}
