import { HttpError } from '../../http/HttpError';
import { formaPagamentoRepository } from '../../repositories/formaPagamento.repository';
import { mapFormaPagamentoToResponse } from './forma-pagamento.mapper';
import { parseFormaPagamentoBody } from './parse-forma-pagamento-body';

export async function createFormaPagamentoUseCase(tenantId: number, body: Record<string, unknown>) {
	const parsed = parseFormaPagamentoBody(body);

	const existing = await formaPagamentoRepository.findByNomeInTenant(tenantId, parsed.nome);
	if (existing) {
		throw new HttpError(409, 'Já existe forma de pagamento com este nome neste tenant');
	}

	const created = await formaPagamentoRepository.create(tenantId, {
		...parsed,
		padrao: false
	});

	return mapFormaPagamentoToResponse(created);
}
