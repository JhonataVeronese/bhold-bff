import { HttpError } from '../../http/HttpError';
import { formaPagamentoRepository } from '../../repositories/formaPagamento.repository';
import { parsePositiveInt } from '../../utils/strings';

export async function deleteFormaPagamentoUseCase(tenantId: number, idRaw: unknown) {
	const id = parsePositiveInt(idRaw);
	if (id === null) {
		throw new HttpError(400, 'id inválido');
	}

	const result = await formaPagamentoRepository.deleteByIdInTenant(tenantId, id);
	if (result === 'not_found') {
		throw new HttpError(404, 'Forma de pagamento não encontrada');
	}
	if (result === 'has_lancamentos') {
		throw new HttpError(409, 'Esta forma de pagamento já foi usada em lançamentos e não pode ser excluída');
	}
}
