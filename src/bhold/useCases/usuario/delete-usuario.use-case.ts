import type { AccessTokenPayload } from '../../auth/jwt';
import { HttpError } from '../../http/HttpError';
import { usuarioRepository } from '../../repositories/usuario.repository';
import { parsePositiveInt } from '../../utils/strings';

/**
 * SUPER pode excluir qualquer usuário; ADMIN apenas usuários do próprio tenant.
 * Não permite excluir o próprio usuário logado.
 */
export async function deleteUsuarioUseCase(auth: AccessTokenPayload, idRaw: unknown) {
	const id = parsePositiveInt(idRaw);
	if (id === null) {
		throw new HttpError(400, 'id inválido');
	}
	if (id === auth.sub) {
		throw new HttpError(400, 'Não é possível excluir o próprio usuário');
	}

	const target = await usuarioRepository.findById(id);
	if (!target) {
		throw new HttpError(404, 'Usuário não encontrado');
	}
	if (auth.perfil !== 'SUPER' && target.tenantId !== auth.tenantId) {
		throw new HttpError(404, 'Usuário não encontrado');
	}

	const deleted = await usuarioRepository.deleteById(id);
	if (!deleted) {
		throw new HttpError(404, 'Usuário não encontrado');
	}
}
