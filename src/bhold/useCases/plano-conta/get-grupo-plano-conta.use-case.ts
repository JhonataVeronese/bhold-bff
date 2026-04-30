import { HttpError } from '../../http/HttpError';
import { planoContaRepository } from '../../repositories/planoConta.repository';
import { parsePositiveInt } from '../../utils/strings';
import { mapGrupoPlanoContaToResponse } from './plano-conta.mapper';

export async function getGrupoPlanoContaUseCase(tenantId: number, idRaw: unknown) {
	const id = parsePositiveInt(idRaw);
	if (id === null) throw new HttpError(400, 'id inválido');

	const row = await planoContaRepository.findGrupoByIdInTenant(tenantId, id);
	if (!row) throw new HttpError(404, 'Grupo de plano de contas não encontrado');

	return mapGrupoPlanoContaToResponse(row);
}
