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

function defaultPeriodoMesCorrenteAteHojeUtc(): { dataDe: Date; dataAte: Date } {
	const now = new Date();
	const y = now.getUTCFullYear();
	const mo = now.getUTCMonth();
	const dia = now.getUTCDate();
	return {
		dataDe: new Date(Date.UTC(y, mo, 1, 12, 0, 0, 0)),
		dataAte: new Date(Date.UTC(y, mo, dia, 12, 0, 0, 0))
	};
}

export async function getResumoPeriodoFinanceiroUseCase(tenantId: number, query: Record<string, unknown>) {
	const dataDeRaw = query.dataDe;
	const dataAteRaw = query.dataAte;

	const bothMissing =
		(dataDeRaw === undefined || dataDeRaw === null || String(dataDeRaw).trim() === '') &&
		(dataAteRaw === undefined || dataAteRaw === null || String(dataAteRaw).trim() === '');
	const oneMissing =
		(dataDeRaw === undefined || dataDeRaw === null || String(dataDeRaw).trim() === '') !==
		(dataAteRaw === undefined || dataAteRaw === null || String(dataAteRaw).trim() === '');

	if (oneMissing) {
		throw new HttpError(
			400,
			'Informe dataDe e dataAte juntos (YYYY-MM-DD), ou omita ambos para o mês corrente até hoje.'
		);
	}

	let dataDe: Date;
	let dataAte: Date;
	let periodoPadraoMesAteHoje = false;
	if (bothMissing) {
		({ dataDe, dataAte } = defaultPeriodoMesCorrenteAteHojeUtc());
		periodoPadraoMesAteHoje = true;
	} else {
		dataDe = parseYmdToUtcDate(dataDeRaw);
		dataAte = parseYmdToUtcDate(dataAteRaw);
	}
	if (dataDe.getTime() > dataAte.getTime()) {
		throw new HttpError(400, 'O período informado é inválido: dataDe deve ser menor ou igual a dataAte.');
	}

	const fimDiaAnteriorAoPeriodo = new Date(dataDe);
	fimDiaAnteriorAoPeriodo.setUTCDate(fimDiaAnteriorAoPeriodo.getUTCDate() - 1);
	fimDiaAnteriorAoPeriodo.setUTCHours(12, 0, 0, 0);

	const [
		movAteDiaAnterior,
		recebidoAteDiaAnterior,
		pagoAteDiaAnterior,
		contasPagas,
		contasRecebidas,
		contasAPagar,
		contasAReceber,
		receitasPorDia,
		despesasPorDia,
		vencidasAPagar,
		vencidasAReceber
	] = await Promise.all([
		movimentoContaEmpresaRepository.sumByTenantUntil(tenantId, fimDiaAnteriorAoPeriodo),
		dashboardFinanceiroRepository.sumPaidUntil(tenantId, 'RECEIVABLE', fimDiaAnteriorAoPeriodo),
		dashboardFinanceiroRepository.sumPaidUntil(tenantId, 'PAYABLE', fimDiaAnteriorAoPeriodo),
		dashboardFinanceiroRepository.sumPaidInRange(tenantId, 'PAYABLE', dataDe, dataAte),
		dashboardFinanceiroRepository.sumPaidInRange(tenantId, 'RECEIVABLE', dataDe, dataAte),
		dashboardFinanceiroRepository.sumDueInRange(tenantId, 'PAYABLE', dataDe, dataAte),
		dashboardFinanceiroRepository.sumDueInRange(tenantId, 'RECEIVABLE', dataDe, dataAte),
		dashboardFinanceiroRepository.dailyPaidByTypeInRange(tenantId, 'RECEIVABLE', dataDe, dataAte),
		dashboardFinanceiroRepository.dailyPaidByTypeInRange(tenantId, 'PAYABLE', dataDe, dataAte),
		lancamentoFinanceiroRepository.listOpenOverdueByTypeUntil(tenantId, 'PAYABLE', dataAte),
		lancamentoFinanceiroRepository.listOpenOverdueByTypeUntil(tenantId, 'RECEIVABLE', dataAte)
	]);

	const saldoInicialPeriodo = movAteDiaAnterior + recebidoAteDiaAnterior - pagoAteDiaAnterior;
	const saldoFinalRealizadoPeriodo = saldoInicialPeriodo + contasRecebidas - contasPagas;

	const receitasMap = new Map(receitasPorDia.map((row) => [formatDateToYmd(row.dia), row.total?.toNumber() ?? 0]));
	const despesasMap = new Map(despesasPorDia.map((row) => [formatDateToYmd(row.dia), row.total?.toNumber() ?? 0]));
	const points = daysBetweenInclusive(dataDe, dataAte);

	return {
		periodo: {
			dataDe: formatDateToYmd(dataDe),
			dataAte: formatDateToYmd(dataAte)
		},
		cards: {
			saldoInicial: saldoInicialPeriodo,
			contasPagas,
			contasRecebidas,
			contasAPagar,
			contasAReceber,
			saldoFinalEsperado: null,
			saldoFinalRealizado: saldoFinalRealizadoPeriodo
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
			source: 'api' as const,
			periodoPadraoMesAteHojeUtc: periodoPadraoMesAteHoje
		}
	};
}
