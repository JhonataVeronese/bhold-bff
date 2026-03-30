import { HttpError } from '../../http/HttpError';
import { contaBancariaEmpresaRepository } from '../../repositories/contaBancariaEmpresa.repository';
import { parsePositiveInt } from '../../utils/strings';

export async function deleteContaBancariaEmpresaUseCase(tenantId: number, idRaw: unknown) {
	const id = parsePositiveInt(idRaw);
	if (id === null) {
		throw new HttpError(400, 'id inválido');
	}
	const result = await contaBancariaEmpresaRepository.deleteByIdInTenant(tenantId, id);
	if (result === 'not_found') {
		throw new HttpError(404, 'Conta não encontrada');
	}
	if (result === 'has_lancamentos') {
		throw new HttpError(409, 'Conta possui lançamentos financeiros vinculados; não é possível excluir.');
	}
}
