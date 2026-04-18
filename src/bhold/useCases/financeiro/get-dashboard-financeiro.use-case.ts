import { HttpError } from '../../http/HttpError';
import { dashboardFinanceiroRepository } from '../../repositories/dashboardFinanceiro.repository';
import { formatDateToYmd, parseYmdToUtcDate } from '../../utils/dates';
import { parsePositiveInt } from '../../utils/strings';

const MESES_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const DIAS_SEMANA_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function pctChange(atual: number, anterior: number): number | null {
	if (anterior === 0) {
		return atual === 0 ? 0 : null;
	}
	return ((atual - anterior) / anterior) * 100;
}

function monthBoundsUtc(year: number, monthIndex0: number) {
	const start = new Date(Date.UTC(year, monthIndex0, 1, 0, 0, 0, 0));
	const end = new Date(Date.UTC(year, monthIndex0 + 1, 0, 23, 59, 59, 999));
	return { start, end };
}

/** Segunda 00:00 UTC até domingo fim do dia UTC da semana que contém `ref`. */
function weekBoundsUtcContaining(ref: Date) {
	const d = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate()));
	const dow = d.getUTCDay();
	const toMonday = dow === 0 ? -6 : 1 - dow;
	const start = new Date(d);
	start.setUTCDate(d.getUTCDate() + toMonday);
	start.setUTCHours(0, 0, 0, 0);
	const end = new Date(start);
	end.setUTCDate(start.getUTCDate() + 6);
	end.setUTCHours(23, 59, 59, 999);
	return { start, end };
}

function parseYear(raw: unknown): number {
	const n = parsePositiveInt(raw);
	if (n !== null && n >= 2000 && n <= 2100) {
		return n;
	}
	return new Date().getUTCFullYear();
}

function resolvePeriodoPrincipalDashboard(
	query: Record<string, unknown>,
	anoAtual: number,
	mesAtual0: number,
	diaHoje: number
): { start: Date; end: Date; origem: 'mes_corrente_ate_hoje_utc' | 'intervalo_personalizado' } {
	const de = query.dataDe;
	const ate = query.dataAte;
	const deEmpty = de === undefined || de === null || String(de).trim() === '';
	const ateEmpty = ate === undefined || ate === null || String(ate).trim() === '';
	if (deEmpty && ateEmpty) {
		return {
			start: new Date(Date.UTC(anoAtual, mesAtual0, 1, 12, 0, 0, 0)),
			end: new Date(Date.UTC(anoAtual, mesAtual0, diaHoje, 12, 0, 0, 0)),
			origem: 'mes_corrente_ate_hoje_utc'
		};
	}
	if (deEmpty !== ateEmpty) {
		throw new HttpError(400, 'Informe dataDe e dataAte juntos (YYYY-MM-DD) ou omita ambos.');
	}
	return {
		start: parseYmdToUtcDate(de),
		end: parseYmdToUtcDate(ate),
		origem: 'intervalo_personalizado'
	};
}

export async function getDashboardFinanceiroUseCase(tenantId: number, query: Record<string, unknown>) {
	const now = new Date();
	const ano = parseYear(query.ano ?? query.year);
	const mesAtual = now.getUTCMonth();
	const anoAtual = now.getUTCFullYear();
	const diaHoje = now.getUTCDate();

	const periodoPrincipal = resolvePeriodoPrincipalDashboard(query, anoAtual, mesAtual, diaHoje);
	if (periodoPrincipal.start.getTime() > periodoPrincipal.end.getTime()) {
		throw new HttpError(400, 'Período inválido: dataDe deve ser menor ou igual a dataAte.');
	}
	const inicioMes = periodoPrincipal.start;
	const fimMes = periodoPrincipal.end;

	const mesAnteriorIdx = mesAtual === 0 ? 11 : mesAtual - 1;
	const anoMesAnterior = mesAtual === 0 ? anoAtual - 1 : anoAtual;
	const { start: inicioMesAnterior, end: fimMesAnterior } = monthBoundsUtc(anoMesAnterior, mesAnteriorIdx);

	const abertoRec = await dashboardFinanceiroRepository.sumOpenByType(tenantId, 'RECEIVABLE');
	const abertoPag = await dashboardFinanceiroRepository.sumOpenByType(tenantId, 'PAYABLE');

	const recebMes = await dashboardFinanceiroRepository.sumPaidInRange(tenantId, 'RECEIVABLE', inicioMes, fimMes);
	const pagMes = await dashboardFinanceiroRepository.sumPaidInRange(tenantId, 'PAYABLE', inicioMes, fimMes);
	const recebMesAnt = await dashboardFinanceiroRepository.sumPaidInRange(
		tenantId,
		'RECEIVABLE',
		inicioMesAnterior,
		fimMesAnterior
	);
	const pagMesAnt = await dashboardFinanceiroRepository.sumPaidInRange(
		tenantId,
		'PAYABLE',
		inicioMesAnterior,
		fimMesAnterior
	);

	const monthlyRows = await dashboardFinanceiroRepository.monthlyCashByYear(tenantId, ano);
	const mapMes = new Map<number, { recebimentos: number; pagamentos: number }>();
	for (const row of monthlyRows) {
		mapMes.set(row.mes, {
			recebimentos: row.recebimentos ? row.recebimentos.toNumber() : 0,
			pagamentos: row.pagamentos ? row.pagamentos.toNumber() : 0
		});
	}
	const visaoGeralMensal = Array.from({ length: 12 }, (_, i) => {
		const m = i + 1;
		const v = mapMes.get(m) ?? { recebimentos: 0, pagamentos: 0 };
		return {
			mes: m,
			mesLabel: MESES_PT[i],
			recebimentos: v.recebimentos,
			pagamentos: v.pagamentos
		};
	});

	const totaisAno = await dashboardFinanceiroRepository.totalsPaidInYear(tenantId, ano);

	const { start: wStart, end: wEnd } = weekBoundsUtcContaining(now);
	const dailyRows = await dashboardFinanceiroRepository.dailyCashInRange(tenantId, wStart, wEnd);
	const byDay = new Map<string, { recebimentos: number; pagamentos: number }>();
	for (const row of dailyRows) {
		const key = row.dia.toISOString().slice(0, 10);
		byDay.set(key, {
			recebimentos: row.recebimentos ? row.recebimentos.toNumber() : 0,
			pagamentos: row.pagamentos ? row.pagamentos.toNumber() : 0
		});
	}
	const movimentacaoSemanal: {
		data: string;
		diaSemana: number;
		diaSemanaLabel: string;
		recebimentos: number;
		pagamentos: number;
	}[] = [];
	for (let i = 0; i < 7; i++) {
		const d = new Date(wStart);
		d.setUTCDate(wStart.getUTCDate() + i);
		const key = d.toISOString().slice(0, 10);
		const v = byDay.get(key) ?? { recebimentos: 0, pagamentos: 0 };
		const dow = d.getUTCDay();
		movimentacaoSemanal.push({
			data: key,
			diaSemana: dow,
			diaSemanaLabel: DIAS_SEMANA_PT[dow],
			recebimentos: v.recebimentos,
			pagamentos: v.pagamentos
		});
	}

	const compRows = await dashboardFinanceiroRepository.compositionInRange(tenantId, inicioMes, fimMes);
	const bucketMap = new Map(compRows.map((r) => [r.bucket, r.valor]));
	const totalComp =
		(bucketMap.get('contas_a_receber') ?? 0) +
		(bucketMap.get('contas_a_pagar') ?? 0) +
		(bucketMap.get('impostos_encargos') ?? 0) +
		(bucketMap.get('outros') ?? 0);

	const categorias = [
		{
			key: 'contas_a_receber',
			label: 'Contas a receber',
			valor: bucketMap.get('contas_a_receber') ?? 0,
			percentual: totalComp > 0 ? ((bucketMap.get('contas_a_receber') ?? 0) / totalComp) * 100 : 0
		},
		{
			key: 'contas_a_pagar',
			label: 'Contas a pagar',
			valor: bucketMap.get('contas_a_pagar') ?? 0,
			percentual: totalComp > 0 ? ((bucketMap.get('contas_a_pagar') ?? 0) / totalComp) * 100 : 0
		},
		{
			key: 'impostos_encargos',
			label: 'Impostos e encargos',
			valor: bucketMap.get('impostos_encargos') ?? 0,
			percentual: totalComp > 0 ? ((bucketMap.get('impostos_encargos') ?? 0) / totalComp) * 100 : 0
		},
		{
			key: 'outros',
			label: 'Outros',
			valor: bucketMap.get('outros') ?? 0,
			percentual: totalComp > 0 ? ((bucketMap.get('outros') ?? 0) / totalComp) * 100 : 0
		}
	];

	// eslint-disable-next-line max-len -- chamada única ao repositório
	const totalLancamentosMes = await dashboardFinanceiroRepository.countLancamentosInRange(tenantId, inicioMes, fimMes);

	const ufs = await dashboardFinanceiroRepository.payablesSumBySupplierUf(tenantId, inicioMes, fimMes);
	const totalUf = ufs.reduce((s, r) => s + (r.total ? r.total.toNumber() : 0), 0);
	const pagamentosPorUfLista = ufs.map((r) => ({
		uf: r.uf,
		valor: r.total ? r.total.toNumber() : 0,
		percentual: totalUf > 0 && r.total ? (r.total.toNumber() / totalUf) * 100 : 0
	}));

	const recebTotalMesUf = await dashboardFinanceiroRepository.receivablesTotalInRange(tenantId, inicioMes, fimMes);

	const recebUfs = await dashboardFinanceiroRepository.receivablesSumByCustomerUf(tenantId, inicioMes, fimMes);
	const totalRecebUf = recebUfs.reduce((s, r) => s + (r.total ? r.total.toNumber() : 0), 0);
	const recebimentosPorUfLista = recebUfs.map((r) => ({
		uf: r.uf,
		valor: r.total ? r.total.toNumber() : 0,
		percentual: totalRecebUf > 0 && r.total ? (r.total.toNumber() / totalRecebUf) * 100 : 0
	}));

	return {
		meta: {
			geradoEm: now.toISOString(),
			fuso: 'UTC',
			anoReferenciaVisaoGeral: ano,
			semanaReferencia: {
				inicio: wStart.toISOString().slice(0, 10),
				fim: wEnd.toISOString().slice(0, 10)
			},
			mesReferenciaCartoes: {
				ano: anoAtual,
				mes: mesAtual + 1
			},
			periodoPrincipal: {
				origem: periodoPrincipal.origem,
				dataDe: formatDateToYmd(periodoPrincipal.start),
				dataAte: formatDateToYmd(periodoPrincipal.end)
			}
		},
		resumo: {
			contasAReceberEmAberto: {
				valor: abertoRec.valor,
				quantidadeTitulos: abertoRec.quantidade,
				variacaoPercentual: null,
				nota: 'Variação percentual exige histórico de saldo; não calculada.'
			},
			contasAPagarEmAberto: {
				valor: abertoPag.valor,
				quantidadeTitulos: abertoPag.quantidade,
				variacaoPercentual: null,
				nota: 'Variação percentual exige histórico de saldo; não calculada.'
			},
			recebimentosDoMes: {
				valor: recebMes,
				mesAnteriorValor: recebMesAnt,
				variacaoPercentual: pctChange(recebMes, recebMesAnt)
			},
			pagamentosDoMes: {
				valor: pagMes,
				mesAnteriorValor: pagMesAnt,
				variacaoPercentual: pctChange(pagMes, pagMesAnt)
			}
		},
		visaoGeralMensal: {
			granularidade: 'mensal',
			ano,
			pontos: visaoGeralMensal,
			totaisPeriodo: {
				totalRecebimentos: totaisAno.totalRecebimentos,
				totalPagamentos: totaisAno.totalPagamentos
			}
		},
		movimentacaoSemanal: {
			rotulo: 'semana_atual_utc',
			periodo: { inicio: wStart.toISOString(), fim: wEnd.toISOString() },
			dias: movimentacaoSemanal
		},
		composicaoFluxo: {
			periodo: {
				tipo: periodoPrincipal.origem,
				inicio: inicioMes.toISOString(),
				fim: fimMes.toISOString()
			},
			totalLancamentos: totalLancamentosMes,
			valorTotalComposto: totalComp,
			categorias
		},
		abrangenciaPorEstado: {
			fonte:
				'fornecedor.uf em contas a pagar; cliente.uf em contas a receber (caixa quitado no período principal; ver meta.periodoPrincipal)',
			recebimentos: {
				total: recebTotalMesUf,
				porUf: recebimentosPorUfLista,
				nota: 'Total recebido no mês; porUf agrupa pelo UF do cliente vinculado ao lançamento.'
			},
			pagamentosPorUf: pagamentosPorUfLista
		}
	};
}
