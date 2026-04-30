import { HttpError } from '../../http/HttpError';
import { planoContaRepository } from '../../repositories/planoConta.repository';
import { parsePositiveInt } from '../../utils/strings';
import { mapPlanoContaToResponse } from './plano-conta.mapper';

export async function getPlanoContaUseCase(tenantId: number, idRaw: unknown) {
	const id = parsePositiveInt(idRaw);
	if (id === null) throw new HttpError(400, 'id inválido');

	const row = await planoContaRepository.findContaByIdInTenant(tenantId, id);
	if (!row) throw new HttpError(404, 'Plano de conta não encontrado');

	return mapPlanoContaToResponse(row);
}
