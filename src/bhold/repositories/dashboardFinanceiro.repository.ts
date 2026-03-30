import { FinanceType, Prisma } from '@prisma/client';
import { prisma } from '../../infra/db/prisma/client';

function toNum(d: Prisma.Decimal | null | undefined): number {
	return d ? d.toNumber() : 0;
}

export type MonthlyCashRow = {
	mes: number;
	recebimentos: Prisma.Decimal | null;
	pagamentos: Prisma.Decimal | null;
};

export type DailyCashRow = {
	dia: Date;
	recebimentos: Prisma.Decimal | null;
	pagamentos: Prisma.Decimal | null;
};

export type UfValorRow = {
	uf: string;
	total: Prisma.Decimal | null;
};

export const dashboardFinanceiroRepository = {
	async sumOpenByType(tenantId: number, type: FinanceType) {
		const r = await prisma.lancamentoFinanceiro.aggregate({
			where: { tenantId, type, dataPagamento: null },
			_sum: { valor: true },
			_count: { id: true }
		});
		return { valor: toNum(r._sum.valor), quantidade: r._count.id };
	},

	async sumPaidInRange(tenantId: number, type: FinanceType, start: Date, end: Date) {
		const r = await prisma.lancamentoFinanceiro.aggregate({
			where: {
				tenantId,
				type,
				dataPagamento: { gte: start, lte: end }
			},
			_sum: { valor: true }
		});
		return toNum(r._sum.valor);
	},

	/** Títulos com vencimento no período ou pagamento no período (cobertura do mês). */
	async countLancamentosInRange(tenantId: number, start: Date, end: Date) {
		return prisma.lancamentoFinanceiro.count({
			where: {
				tenantId,
				OR: [
					{ dataPagamento: { gte: start, lte: end } },
					{ dataPagamento: null, dataVencimento: { gte: start, lte: end } }
				]
			}
		});
	},

	/** Caixa realizado por mês (dataPagamento), ano civil. */
	async monthlyCashByYear(tenantId: number, year: number): Promise<MonthlyCashRow[]> {
		return prisma.$queryRaw<MonthlyCashRow[]>`
			SELECT
				EXTRACT(MONTH FROM l."dataPagamento")::int AS mes,
				COALESCE(SUM(CASE WHEN l.type = 'RECEIVABLE' THEN l.valor ELSE 0 END), 0) AS recebimentos,
				COALESCE(SUM(CASE WHEN l.type = 'PAYABLE' THEN l.valor ELSE 0 END), 0) AS pagamentos
			FROM "LancamentoFinanceiro" l
			WHERE l."tenantId" = ${tenantId}
				AND l."dataPagamento" IS NOT NULL
				AND EXTRACT(YEAR FROM l."dataPagamento") = ${year}
			GROUP BY 1
			ORDER BY 1
		`;
	},

	/** Totais do período (visão geral — rodapé do gráfico mensal). */
	async totalsPaidInYear(tenantId: number, year: number) {
		const r = await prisma.$queryRaw<{ recebimentos: Prisma.Decimal | null; pagamentos: Prisma.Decimal | null }[]>`
			SELECT
				COALESCE(SUM(CASE WHEN l.type = 'RECEIVABLE' THEN l.valor ELSE 0 END), 0) AS recebimentos,
				COALESCE(SUM(CASE WHEN l.type = 'PAYABLE' THEN l.valor ELSE 0 END), 0) AS pagamentos
			FROM "LancamentoFinanceiro" l
			WHERE l."tenantId" = ${tenantId}
				AND l."dataPagamento" IS NOT NULL
				AND EXTRACT(YEAR FROM l."dataPagamento") = ${year}
		`;
		const row = r[0];
		return {
			totalRecebimentos: toNum(row?.recebimentos),
			totalPagamentos: toNum(row?.pagamentos)
		};
	},

	/** Movimentação diária na semana (caixa por dataPagamento). */
	async dailyCashInRange(tenantId: number, start: Date, end: Date): Promise<DailyCashRow[]> {
		return prisma.$queryRaw<DailyCashRow[]>`
			SELECT
				l."dataPagamento"::date AS dia,
				COALESCE(SUM(CASE WHEN l.type = 'RECEIVABLE' THEN l.valor ELSE 0 END), 0) AS recebimentos,
				COALESCE(SUM(CASE WHEN l.type = 'PAYABLE' THEN l.valor ELSE 0 END), 0) AS pagamentos
			FROM "LancamentoFinanceiro" l
			WHERE l."tenantId" = ${tenantId}
				AND l."dataPagamento" IS NOT NULL
				AND l."dataPagamento" >= ${start}
				AND l."dataPagamento" <= ${end}
			GROUP BY 1
			ORDER BY 1
		`;
	},

	/**
	 * Composição no período (caixa: dataPagamento).
	 * Heurística "impostos_encargos": palavras-chave em descrição/observação (a pagar).
	 */
	async compositionInRange(tenantId: number, start: Date, end: Date) {
		const rows = await prisma.$queryRaw<{ bucket: string; valor: Prisma.Decimal | null }[]>`
			WITH linhas AS (
				SELECT
					l.valor,
					CASE
						WHEN l.type = 'RECEIVABLE' THEN 'contas_a_receber'
						WHEN l.type = 'PAYABLE' AND (
							LOWER(COALESCE(l.descricao, '')) LIKE '%imposto%'
							OR LOWER(COALESCE(l.observacao, '')) LIKE '%imposto%'
							OR LOWER(COALESCE(l.descricao, '')) LIKE '%inss%'
							OR LOWER(COALESCE(l.descricao, '')) LIKE '%irrf%'
							OR LOWER(COALESCE(l.descricao, '')) LIKE '%pis%'
							OR LOWER(COALESCE(l.descricao, '')) LIKE '%cofins%'
							OR LOWER(COALESCE(l.descricao, '')) LIKE '%csll%'
							OR LOWER(COALESCE(l.descricao, '')) LIKE '%iss%'
							OR LOWER(COALESCE(l.descricao, '')) LIKE '%gps%'
							OR LOWER(COALESCE(l.descricao, '')) LIKE '%darf%'
							OR LOWER(COALESCE(l.descricao, '')) LIKE '%das%'
							OR LOWER(COALESCE(l.descricao, '')) LIKE '%taxa %'
							OR LOWER(COALESCE(l.observacao, '')) LIKE '%imposto%'
						) THEN 'impostos_encargos'
						WHEN l.type = 'PAYABLE' THEN 'contas_a_pagar'
						ELSE 'outros'
					END AS bucket
				FROM "LancamentoFinanceiro" l
				WHERE l."tenantId" = ${tenantId}
					AND l."dataPagamento" IS NOT NULL
					AND l."dataPagamento" >= ${start}
					AND l."dataPagamento" <= ${end}
			)
			SELECT bucket, SUM(valor) AS valor
			FROM linhas
			GROUP BY bucket
		`;
		return rows.map((r) => ({ bucket: r.bucket, valor: toNum(r.valor) }));
	},

	/** Pagamentos agregados por UF (fornecedor). */
	async payablesSumBySupplierUf(tenantId: number, start: Date, end: Date): Promise<UfValorRow[]> {
		return prisma.$queryRaw<UfValorRow[]>`
			SELECT f.uf AS uf, SUM(l.valor) AS total
			FROM "LancamentoFinanceiro" l
			INNER JOIN "Fornecedor" f ON f.id = l."fornecedorId"
			WHERE l."tenantId" = ${tenantId}
				AND l.type = 'PAYABLE'
				AND l."dataPagamento" IS NOT NULL
				AND l."dataPagamento" >= ${start}
				AND l."dataPagamento" <= ${end}
			GROUP BY f.uf
			ORDER BY total DESC
		`;
	},

	/** Total de recebimentos quitados no período (todos os lançamentos a receber). */
	async receivablesTotalInRange(tenantId: number, start: Date, end: Date) {
		return this.sumPaidInRange(tenantId, 'RECEIVABLE', start, end);
	},

	/** Recebimentos agregados por UF (cliente). */
	async receivablesSumByCustomerUf(tenantId: number, start: Date, end: Date): Promise<UfValorRow[]> {
		return prisma.$queryRaw<UfValorRow[]>`
			SELECT c.uf AS uf, SUM(l.valor) AS total
			FROM "LancamentoFinanceiro" l
			INNER JOIN "Cliente" c ON c.id = l."clienteId"
			WHERE l."tenantId" = ${tenantId}
				AND l.type = 'RECEIVABLE'
				AND l."dataPagamento" IS NOT NULL
				AND l."dataPagamento" >= ${start}
				AND l."dataPagamento" <= ${end}
			GROUP BY c.uf
			ORDER BY total DESC
		`;
	}
};
