import { HttpError } from '../../http/HttpError';
import { contaBancariaEmpresaRepository } from '../../repositories/contaBancariaEmpresa.repository';
import { lancamentoFinanceiroRepository } from '../../repositories/lancamentoFinanceiro.repository';
import { monthBoundsUtcDates } from '../../utils/monthBounds';
import { parsePositiveInt, str } from '../../utils/strings';
import { mapExtratoFinanceiroItem } from './map-extrato-item';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

function parseYear(v: unknown): number | null {
	const n = typeof v === 'number' ? v : parseInt(str(v), 10);
	if (!Number.isInteger(n) || n < 2000 || n > 2100) {
		return null;
	}
	return n;
}

function parseMonth(v: unknown): number | null {
	const n = typeof v === 'number' ? v : parseInt(str(v), 10);
	if (!Number.isInteger(n) || n < 1 || n > 12) {
		return null;
	}
	return n;
}

export async function getExtratoFinanceiroUseCase(tenantId: number, query: Record<string, unknown>) {
	const contaId = parsePositiveInt(query.contaId);
	if (contaId === null) {
		throw new HttpError(400, 'contaId é obrigatório (id da conta da empresa)');
	}

	const ano = parseYear(query.ano ?? query.year);
	if (ano === null) {
		throw new HttpError(400, 'ano é obrigatório (ex.: 2026)');
	}

	const mes = parseMonth(query.mes ?? query.month);
	if (mes === null) {
		throw new HttpError(400, 'mes é obrigatório (1 a 12)');
	}

	const conta = await contaBancariaEmpresaRepository.findByIdInTenant(tenantId, contaId);
	if (!conta) {
		throw new HttpError(400, 'contaId não encontrado neste tenant');
	}

	let page = parsePositiveInt(query.page);
	if (page === null) {
		page = 1;
	}
	if (page < 1) {
		throw new HttpError(400, 'page deve ser ≥ 1');
	}

	let pageSize = parsePositiveInt(query.pageSize);
	if (pageSize === null) {
		pageSize = DEFAULT_PAGE_SIZE;
	}
	if (pageSize < 1) {
		throw new HttpError(400, 'pageSize deve ser ≥ 1');
	}
	if (pageSize > MAX_PAGE_SIZE) {
		pageSize = MAX_PAGE_SIZE;
	}

	const { start, end } = monthBoundsUtcDates(ano, mes);
	const skip = (page - 1) * pageSize;

	const [totalItems, ids] = await Promise.all([
		lancamentoFinanceiroRepository.countExtratoMes(tenantId, contaId, start, end),
		lancamentoFinanceiroRepository.listIdsExtratoMesOrdenados(tenantId, contaId, start, end, skip, pageSize)
	]);

	const rows = await lancamentoFinanceiroRepository.findManyByIdsInOrder(ids);
	const data = rows.map(mapExtratoFinanceiroItem);

	const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize);

	return {
		data,
		pagination: {
			page,
			pageSize,
			totalItems,
			totalPages
		}
	};
}
