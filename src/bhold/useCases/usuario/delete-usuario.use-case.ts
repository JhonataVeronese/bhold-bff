import { HttpError } from '../../http/HttpError';
import { usuarioRepository } from '../../repositories/usuario.repository';
import { parsePositiveInt } from '../../utils/strings';

/**
 * Exclusão global (perfil SUPER). Não permite excluir o próprio usuário logado.
 */
export async function deleteUsuarioUseCase(currentUserId: number, idRaw: unknown) {
	const id = parsePositiveInt(idRaw);
	if (id === null) {
		throw new HttpError(400, 'id inválido');
	}
	if (id === currentUserId) {
		throw new HttpError(400, 'Não é possível excluir o próprio usuário');
	}
	const deleted = await usuarioRepository.deleteById(id);
	if (!deleted) {
		throw new HttpError(404, 'Usuário não encontrado');
	}
}
