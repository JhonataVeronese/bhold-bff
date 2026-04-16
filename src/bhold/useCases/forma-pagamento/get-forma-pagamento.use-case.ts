import { HttpError } from '../../http/HttpError';
import { formaPagamentoRepository } from '../../repositories/formaPagamento.repository';
import { parsePositiveInt } from '../../utils/strings';
import { mapFormaPagamentoToResponse } from './forma-pagamento.mapper';

export async function getFormaPagamentoUseCase(tenantId: number, idRaw: unknown) {
	const id = parsePositiveInt(idRaw);
	if (id === null) {
		throw new HttpError(400, 'id inválido');
	}

	const row = await formaPagamentoRepository.findByIdInTenant(tenantId, id);
	if (!row) {
		throw new HttpError(404, 'Forma de pagamento não encontrada');
	}

	return mapFormaPagamentoToResponse(row);
}
