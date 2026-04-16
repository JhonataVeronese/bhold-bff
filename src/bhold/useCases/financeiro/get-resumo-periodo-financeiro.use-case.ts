import { HttpError } from '../../http/HttpError';
import { dashboardFinanceiroRepository } from '../../repositories/dashboardFinanceiro.repository';
import { lancamentoFinanceiroRepository } from '../../repositories/lancamentoFinanceiro.repository';
import { movimentoContaEmpresaRepository } from '../../repositories/movimentoContaEmpresa.repository';
import { formatDateToYmd, parseYmdToUtcDate } from '../../utils/dates';
import { typeToJson } from './financeiro.mapper';

function formatChartLabel(date: Date): string {
	const ymd = formatDateToYmd(date);
	const [, month, day] = ymd.split('-');
	return `${day}/${month}`;
}

function daysBetweenInclusive(start: Date, end: Date): Date[] {
	const days: Date[] = [];
	const cursor = new Date(start);
	cursor.setUTCHours(12, 0, 0, 0);
	while (cursor.getTime() <= end.getTime()) {
		days.push(new Date(cursor));
		cursor.setUTCDate(cursor.getUTCDate() + 1);
	}
	return days;
}

function mapOverdueTableRow(
	row: Awaited<ReturnType<typeof lancamentoFinanceiroRepository.listOpenOverdueByTypeUntil>>[number]
) {
	const contraParte =
		row.type === 'PAYABLE'
			? row.fornecedor
				? row.fornecedor.nomeFantasia || row.fornecedor.razaoSocial
				: ''
			: row.cliente
			? row.cliente.nomeFantasia || row.cliente.razaoSocial
			: '';

	return {
		id: `${row.type === 'PAYABLE' ? 'cp' : 'cr'}-${row.id}`,
		kind: typeToJson(row.type),
		dataVencimento: formatDateToYmd(row.dataVencimento),
		dataPagamento: row.dataPagamento ? formatDateToYmd(row.dataPagamento) : null,
		descricao: row.descricao,
		contraParte,
		valor: row.valor.toNumber()
	};
}

export async function getResumoPeriodoFinanceiroUseCase(tenantId: number, query: Record<string, unknown>) {
	const dataDeRaw = query.dataDe;
	const dataAteRaw = query.dataAte;

	if (
		dataDeRaw === undefined ||
		dataDeRaw === null ||
		String(dataDeRaw).trim() === '' ||
		dataAteRaw === undefined ||
		dataAteRaw === null ||
		String(dataAteRaw).trim() === ''
	) {
		throw new HttpError(400, 'Parâmetros obrigatórios: dataDe e dataAte no formato YYYY-MM-DD.');
	}

	const dataDe = parseYmdToUtcDate(dataDeRaw);
	const dataAte = parseYmdToUtcDate(dataAteRaw);
	if (dataDe.getTime() > dataAte.getTime()) {
		throw new HttpError(400, 'O período informado é inválido: dataDe deve ser menor ou igual a dataAte.');
	}

	const now = new Date();

	const [
		totalMovimentosAteAgora,
		totalRecebidoAteAgora,
		totalPagoAteAgora,
		contasPagas,
		contasRecebidas,
		contasAPagar,
		contasAReceber,
		receitasPorDia,
		despesasPorDia,
		vencidasAPagar,
		vencidasAReceber
	] = await Promise.all([
		movimentoContaEmpresaRepository.sumByTenantUntil(tenantId, now),
		dashboardFinanceiroRepository.sumPaidUntil(tenantId, 'RECEIVABLE', now),
		dashboardFinanceiroRepository.sumPaidUntil(tenantId, 'PAYABLE', now),
		dashboardFinanceiroRepository.sumPaidInRange(tenantId, 'PAYABLE', dataDe, dataAte),
		dashboardFinanceiroRepository.sumPaidInRange(tenantId, 'RECEIVABLE', dataDe, dataAte),
		dashboardFinanceiroRepository.sumDueInRange(tenantId, 'PAYABLE', dataDe, dataAte),
		dashboardFinanceiroRepository.sumDueInRange(tenantId, 'RECEIVABLE', dataDe, dataAte),
		dashboardFinanceiroRepository.dailyPaidByTypeInRange(tenantId, 'RECEIVABLE', dataDe, dataAte),
		dashboardFinanceiroRepository.dailyPaidByTypeInRange(tenantId, 'PAYABLE', dataDe, dataAte),
		lancamentoFinanceiroRepository.listOpenOverdueByTypeUntil(tenantId, 'PAYABLE', dataAte),
		lancamentoFinanceiroRepository.listOpenOverdueByTypeUntil(tenantId, 'RECEIVABLE', dataAte)
	]);

	const receitasMap = new Map(receitasPorDia.map((row) => [formatDateToYmd(row.dia), row.total?.toNumber() ?? 0]));
	const despesasMap = new Map(despesasPorDia.map((row) => [formatDateToYmd(row.dia), row.total?.toNumber() ?? 0]));
	const points = daysBetweenInclusive(dataDe, dataAte);
	const saldoAtual = totalMovimentosAteAgora + totalRecebidoAteAgora - totalPagoAteAgora;

	return {
		periodo: {
			dataDe: formatDateToYmd(dataDe),
			dataAte: formatDateToYmd(dataAte)
		},
		cards: {
			saldoInicial: saldoAtual,
			contasPagas,
			contasRecebidas,
			contasAPagar,
			contasAReceber,
			saldoFinalEsperado: null,
			saldoFinalRealizado: null
		},
		chart: {
			receitas: points.map((date) => {
				const key = formatDateToYmd(date);
				return { x: formatChartLabel(date), y: receitasMap.get(key) ?? 0 };
			}),
			despesas: points.map((date) => {
				const key = formatDateToYmd(date);
				return { x: formatChartLabel(date), y: despesasMap.get(key) ?? 0 };
			})
		},
		tables: {
			contasVencidasAPagar: vencidasAPagar.map(mapOverdueTableRow),
			contasVencidasAReceber: vencidasAReceber.map(mapOverdueTableRow)
		},
		meta: {
			source: 'api' as const
		}
	};
}
