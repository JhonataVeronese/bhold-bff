import { HttpError } from '../../http/HttpError';
import { formaPagamentoRepository } from '../../repositories/formaPagamento.repository';
import { parsePositiveInt } from '../../utils/strings';
import { mapFormaPagamentoToResponse } from './forma-pagamento.mapper';
import { parseFormaPagamentoBody } from './parse-forma-pagamento-body';

export async function updateFormaPagamentoUseCase(tenantId: number, idRaw: unknown, body: Record<string, unknown>) {
	const id = parsePositiveInt(idRaw);
	if (id === null) {
		throw new HttpError(400, 'id inválido');
	}

	const parsed = parseFormaPagamentoBody(body);
	const existingByNome = await formaPagamentoRepository.findByNomeInTenant(tenantId, parsed.nome, id);
	if (existingByNome) {
		throw new HttpError(409, 'Já existe forma de pagamento com este nome neste tenant');
	}

	const updated = await formaPagamentoRepository.update(tenantId, id, parsed);
	if (!updated) {
		throw new HttpError(404, 'Forma de pagamento não encontrada');
	}

	return mapFormaPagamentoToResponse(updated);
}
