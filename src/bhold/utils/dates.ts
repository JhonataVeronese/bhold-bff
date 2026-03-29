import { HttpError } from '../http/HttpError';

/** Converte data `YYYY-MM-DD` para `Date` em UTC (meio-dia) para colunas `@db.Date`. */
export function parseYmdToUtcDate(value: unknown): Date {
	const s = typeof value === 'string' ? value.trim() : '';
	const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
	if (!m) {
		throw new HttpError(400, 'Data inválida (use YYYY-MM-DD)');
	}
	const y = Number(m[1]);
	const mo = Number(m[2]);
	const d = Number(m[3]);
	if (mo < 1 || mo > 12 || d < 1 || d > 31) {
		throw new HttpError(400, 'Data inválida');
	}
	return new Date(Date.UTC(y, mo - 1, d, 12, 0, 0, 0));
}

export function formatDateToYmd(date: Date): string {
	return date.toISOString().slice(0, 10);
}
