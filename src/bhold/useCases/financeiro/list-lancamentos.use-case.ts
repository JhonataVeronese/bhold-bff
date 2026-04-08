import { FinanceType } from '@prisma/client';
import { lancamentoFinanceiroRepository } from '../../repositories/lancamentoFinanceiro.repository';
import { parseListLancamentosByTypeQuery, parseOptionalFinanceTypeQuery } from './financeiro-parsers';
import { mapLancamentoToRow } from './financeiro.mapper';

export async function listLancamentosUseCase(tenantId: number, query: Record<string, unknown>) {
	const type = parseOptionalFinanceTypeQuery(query);
	const rows = await lancamentoFinanceiroRepository.listByTenant(tenantId, type);
	return { data: rows.map(mapLancamentoToRow) };
}

export async function listLancamentosByTypeUseCase(
	tenantId: number,
	type: FinanceType,
	query: Record<string, unknown>
) {
	const { page, pageSize, skip, filters } = parseListLancamentosByTypeQuery(query);

	const [totalItems, rows] = await Promise.all([
		lancamentoFinanceiroRepository.countByTenantWithFilters(tenantId, { type, ...filters }),
		lancamentoFinanceiroRepository.listByTenantPaginated(tenantId, { type, ...filters }, skip, pageSize)
	]);

	return {
		data: rows.map(mapLancamentoToRow),
		pagination: {
			page,
			pageSize,
			totalItems,
			totalPages: totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize)
		}
	};
}
