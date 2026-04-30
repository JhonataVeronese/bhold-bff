import { HttpError } from '../../http/HttpError';
import { planoContaRepository } from '../../repositories/planoConta.repository';
import { parsePositiveInt } from '../../utils/strings';

export async function deleteGrupoPlanoContaUseCase(tenantId: number, idRaw: unknown) {
	const id = parsePositiveInt(idRaw);
	if (id === null) throw new HttpError(400, 'id inválido');

	const result = await planoContaRepository.deleteGrupoByIdInTenant(tenantId, id);
	if (result === 'not_found') throw new HttpError(404, 'Grupo de plano de contas não encontrado');
	if (result === 'system_default') {
		throw new HttpError(409, 'Este grupo foi inserido via seed e não pode ser excluído');
	}
	if (result === 'has_children') {
		throw new HttpError(409, 'Este grupo possui subgrupos vinculados e não pode ser excluído');
	}
	if (result === 'has_contas') {
		throw new HttpError(409, 'Este grupo possui contas vinculadas e não pode ser excluído');
	}
}
