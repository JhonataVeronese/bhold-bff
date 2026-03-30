import { HttpError } from '../../http/HttpError';
import { clienteRepository } from '../../repositories/cliente.repository';
import { parsePositiveInt } from '../../utils/strings';
import { mapClienteToResponse } from './cliente.mapper';

export async function getClienteByIdUseCase(tenantId: number, idRaw: unknown) {
	const id = parsePositiveInt(idRaw);
	if (id === null) {
		throw new HttpError(400, 'id inválido');
	}
	const row = await clienteRepository.findByIdInTenant(tenantId, id);
	if (!row) {
		throw new HttpError(404, 'Cliente não encontrado');
	}
	return mapClienteToResponse(row);
}
