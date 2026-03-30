import { HttpError } from '../../http/HttpError';
import { contaBancariaTerceiroRepository } from '../../repositories/contaBancariaTerceiro.repository';
import { parsePositiveInt } from '../../utils/strings';

export async function deleteContaBancariaTerceiroUseCase(tenantId: number, idRaw: unknown) {
	const id = parsePositiveInt(idRaw);
	if (id === null) {
		throw new HttpError(400, 'id inválido');
	}
	const result = await contaBancariaTerceiroRepository.deleteByIdInTenant(tenantId, id);
	if (result === 'not_found') {
		throw new HttpError(404, 'Conta de terceiro não encontrada');
	}
	if (result === 'has_lancamentos') {
		throw new HttpError(409, 'Conta possui lançamentos financeiros vinculados; não é possível excluir.');
	}
}
