import { FinanceType, RecurrenceType } from '@prisma/client';
import { HttpError } from '../../http/HttpError';
import { parseYmdToUtcDate } from '../../utils/dates';
import { parsePositiveInt, str } from '../../utils/strings';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export type ListLancamentosByTypeFilters = {
	contaBancariaEmpresaId?: number;
	dataVencimentoDe?: Date;
	dataVencimentoAte?: Date;
};

export type ListLancamentosByTypeQuery = {
	page: number;
	pageSize: number;
	skip: number;
	filters: ListLancamentosByTypeFilters;
};

function hasValue(v: unknown): boolean {
	return v !== undefined && v !== null && str(v) !== '';
}

function parseDateQuery(value: unknown, field: string): Date | undefined {
	const raw = str(value);
	if (!raw) {
		return undefined;
	}

	if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
		const [day, month, year] = raw.split('/');
		return parseYmdToUtcDate(`${year}-${month}-${day}`);
	}

	try {
		return parseYmdToUtcDate(raw);
	} catch (error) {
		if (error instanceof HttpError) {
			throw new HttpError(400, `${field} deve estar em YYYY-MM-DD ou DD/MM/AAAA`);
		}
		throw error;
	}
}

function parseRequiredPositiveIntQuery(value: unknown, field: string): number | undefined {
	if (!hasValue(value)) {
		return undefined;
	}

	const parsed = parsePositiveInt(value);
	if (parsed === null) {
		throw new HttpError(400, `${field} deve ser um inteiro positivo`);
	}

	return parsed;
}

export function parseFinanceType(v: unknown, field = 'type'): FinanceType {
	const raw = str(v);
	const s = raw.toLowerCase();
	if (s === 'payable') return 'PAYABLE';
	if (s === 'receivable') return 'RECEIVABLE';
	throw new HttpError(400, `${field} deve ser PAYABLE ou RECEIVABLE`);
}

export function parseOptionalFinanceTypeQuery(query: Record<string, unknown>): FinanceType | undefined {
	const raw = query.type ?? query.kind;
	if (raw === undefined || raw === null || String(raw).trim() === '') return undefined;
	return parseFinanceType(raw, 'type (query)');
}

export function parseRecurrenceKind(v: unknown): RecurrenceType {
	const s = str(v).toLowerCase();
	if (s === 'unica') return 'UNICA';
	if (s === 'mensal') return 'MENSAL';
	if (s === 'anual') return 'ANUAL';
	throw new HttpError(400, 'recorrenciaTipo deve ser unica, mensal ou anual');
}

export function parseListLancamentosByTypeQuery(query: Record<string, unknown>): ListLancamentosByTypeQuery {
	const page = parseRequiredPositiveIntQuery(query.page, 'page') ?? 1;

	let pageSize = parseRequiredPositiveIntQuery(query.pageSize, 'pageSize') ?? DEFAULT_PAGE_SIZE;
	if (pageSize > MAX_PAGE_SIZE) {
		pageSize = MAX_PAGE_SIZE;
	}

	const contaBancariaEmpresaId = parseRequiredPositiveIntQuery(
		query.contaBancariaEmpresaId ?? query.contaBancariaId ?? query.contaId,
		'contaBancariaId'
	);

	const dataVencimentoDe = parseDateQuery(
		query.dataVencimentoDe ?? query.vencimentoDe ?? query.startDate,
		'dataVencimentoDe'
	);
	const dataVencimentoAte = parseDateQuery(
		query.dataVencimentoAte ?? query.vencimentoAte ?? query.endDate,
		'dataVencimentoAte'
	);

	if (dataVencimentoDe && dataVencimentoAte && dataVencimentoDe.getTime() > dataVencimentoAte.getTime()) {
		throw new HttpError(400, 'dataVencimentoDe não pode ser maior que dataVencimentoAte');
	}

	return {
		page,
		pageSize,
		skip: (page - 1) * pageSize,
		filters: {
			...(contaBancariaEmpresaId !== undefined ? { contaBancariaEmpresaId } : {}),
			...(dataVencimentoDe ? { dataVencimentoDe } : {}),
			...(dataVencimentoAte ? { dataVencimentoAte } : {})
		}
	};
}
