import { UsuarioPerfil } from '@prisma/client';
import { HttpError } from '../../http/HttpError';
import { str } from '../../utils/strings';

/** Aceita `admin` | `operador` | `leitura` (front) ou ADMIN/OPERADOR/LEITURA. */
export function parseUsuarioPerfil(v: unknown): UsuarioPerfil {
	const s = str(v).toLowerCase();
	if (s === 'super') {
		throw new HttpError(403, 'perfil super não pode ser atribuído via API');
	}
	if (s === 'admin') return 'ADMIN';
	if (s === 'operador') return 'OPERADOR';
	if (s === 'leitura') return 'LEITURA';
	const u = str(v).toUpperCase();
	if (u === 'ADMIN' || u === 'OPERADOR' || u === 'LEITURA') {
		return u as UsuarioPerfil;
	}
	throw new HttpError(400, 'perfil deve ser admin, operador ou leitura');
}
