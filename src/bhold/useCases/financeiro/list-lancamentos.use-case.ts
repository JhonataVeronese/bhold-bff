import { FinanceType } from '@prisma/client';
import { lancamentoFinanceiroRepository } from '../../repositories/lancamentoFinanceiro.repository';
import { parseOptionalFinanceTypeQuery } from './financeiro-parsers';
import { mapLancamentoToRow } from './financeiro.mapper';

export async function listLancamentosUseCase(tenantId: number, query: Record<string, unknown>) {
	const type = parseOptionalFinanceTypeQuery(query);
	const rows = await lancamentoFinanceiroRepository.listByTenant(tenantId, type);
	return { data: rows.map(mapLancamentoToRow) };
}

export async function listLancamentosByTypeUseCase(tenantId: number, type: FinanceType) {
	const rows = await lancamentoFinanceiroRepository.listByTenant(tenantId, type);
	return { data: rows.map(mapLancamentoToRow) };
}
