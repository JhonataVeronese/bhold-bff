/** Primeiro e último instante UTC do mês civil (mes = 1–12), para filtros em colunas `@db.Date`. */
export function monthBoundsUtcDates(year: number, month1to12: number): { start: Date; end: Date } {
	const lastDay = new Date(Date.UTC(year, month1to12, 0)).getUTCDate();
	const start = new Date(Date.UTC(year, month1to12 - 1, 1, 12, 0, 0, 0));
	const end = new Date(Date.UTC(year, month1to12 - 1, lastDay, 12, 0, 0, 0));
	return { start, end };
}
