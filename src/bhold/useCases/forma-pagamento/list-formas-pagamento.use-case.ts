import { formaPagamentoRepository } from '../../repositories/formaPagamento.repository';
import { mapFormaPagamentoToResponse } from './forma-pagamento.mapper';

export async function listFormasPagamentoUseCase(tenantId: number) {
	const rows = await formaPagamentoRepository.listByTenant(tenantId);
	return { data: rows.map(mapFormaPagamentoToResponse) };
}
