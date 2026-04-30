import { HttpError } from '../../http/HttpError';
import { planoContaRepository } from '../../repositories/planoConta.repository';
import { parsePositiveInt } from '../../utils/strings';

export async function deletePlanoContaUseCase(tenantId: number, idRaw: unknown) {
	const id = parsePositiveInt(idRaw);
	if (id === null) throw new HttpError(400, 'id inválido');

	const result = await planoContaRepository.deleteContaByIdInTenant(tenantId, id);
	if (result === 'not_found') throw new HttpError(404, 'Plano de conta não encontrado');
	if (result === 'system_default') {
		throw new HttpError(409, 'Este plano de conta foi inserido via seed e não pode ser excluído');
	}
	if (result === 'has_lancamentos') {
		throw new HttpError(409, 'Este plano de conta já foi utilizado em lançamentos e não pode ser excluído');
	}
}
