import { FinanceType, RecurrenceType } from '@prisma/client';
import { HttpError } from '../../http/HttpError';
import { str } from '../../utils/strings';

export function parseFinanceType(v: unknown, field = 'type'): FinanceType {
	const s = str(v).toLowerCase();
	if (s === 'payable') return 'PAYABLE';
	if (s === 'receivable') return 'RECEIVABLE';
	throw new HttpError(400, `${field} deve ser payable ou receivable`);
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
