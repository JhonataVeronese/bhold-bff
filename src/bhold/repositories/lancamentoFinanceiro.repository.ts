import { FinanceType, Prisma, RecurrenceType } from '@prisma/client';
import { prisma } from '../../infra/db/prisma/client';

const includeRelacoes = {
	contaBancariaEmpresa: true,
	contaBancariaTerceiro: true,
	fornecedor: true,
	cliente: true
} satisfies Prisma.LancamentoFinanceiroInclude;

export type LancamentoComRelacoes = Prisma.LancamentoFinanceiroGetPayload<{
	include: typeof includeRelacoes;
}>;

type LancamentoListFilters = {
	type?: FinanceType;
	contaBancariaEmpresaId?: number;
	dataVencimentoDe?: Date;
	dataVencimentoAte?: Date;
};

function buildListWhere(tenantId: number, filters: LancamentoListFilters = {}): Prisma.LancamentoFinanceiroWhereInput {
	const contaBancariaFilter: Prisma.LancamentoFinanceiroWhereInput = {};
	if (filters.contaBancariaEmpresaId !== undefined) {
		contaBancariaFilter.contaBancariaEmpresaId = filters.contaBancariaEmpresaId;
	}

	const dataVencimentoFilter: Prisma.LancamentoFinanceiroWhereInput = {};
	if (filters.dataVencimentoDe || filters.dataVencimentoAte) {
		dataVencimentoFilter.dataVencimento = {
			...(filters.dataVencimentoDe ? { gte: filters.dataVencimentoDe } : {}),
			...(filters.dataVencimentoAte ? { lte: filters.dataVencimentoAte } : {})
		};
	}

	return {
		tenantId,
		...(filters.type !== undefined ? { type: filters.type } : {}),
		...contaBancariaFilter,
		...dataVencimentoFilter
	};
}

export const lancamentoFinanceiroRepository = {
	/**
	 * IDs ordenados por COALESCE(dataPagamento, dataVencimento) DESC (extrato).
	 * Paginação aplicada na ordem correta.
	 */
	async listIdsExtratoMesOrdenados(
		tenantId: number,
		contaBancariaEmpresaId: number,
		start: Date,
		end: Date,
		skip: number,
		take: number
	): Promise<number[]> {
		const rows = await prisma.$queryRaw<Array<{ id: number }>>(
			Prisma.sql`
				SELECT l.id
				FROM "LancamentoFinanceiro" l
				WHERE l."tenantId" = ${tenantId}
					AND l."contaBancariaEmpresaId" = ${contaBancariaEmpresaId}
					AND (
						(
							l."dataPagamento" IS NOT NULL
							AND l."dataPagamento" >= ${start}::date
							AND l."dataPagamento" <= ${end}::date
						)
						OR
						(
							l."dataPagamento" IS NULL
							AND l."dataVencimento" >= ${start}::date
							AND l."dataVencimento" <= ${end}::date
						)
					)
				ORDER BY COALESCE(l."dataPagamento", l."dataVencimento") DESC
				LIMIT ${take} OFFSET ${skip}
			`
		);
		return rows.map((r) => r.id);
	},

	async countExtratoMes(tenantId: number, contaBancariaEmpresaId: number, start: Date, end: Date): Promise<number> {
		const r = await prisma.$queryRaw<[{ c: bigint }]>(
			Prisma.sql`
				SELECT COUNT(*)::bigint AS c
				FROM "LancamentoFinanceiro" l
				WHERE l."tenantId" = ${tenantId}
					AND l."contaBancariaEmpresaId" = ${contaBancariaEmpresaId}
					AND (
						(
							l."dataPagamento" IS NOT NULL
							AND l."dataPagamento" >= ${start}::date
							AND l."dataPagamento" <= ${end}::date
						)
						OR
						(
							l."dataPagamento" IS NULL
							AND l."dataVencimento" >= ${start}::date
							AND l."dataVencimento" <= ${end}::date
						)
					)
			`
		);
		return Number(r[0]?.c ?? 0);
	},

	async findManyByIdsInOrder(ids: number[]) {
		if (ids.length === 0) {
			return [];
		}
		const rows = await prisma.lancamentoFinanceiro.findMany({
			where: { id: { in: ids } },
			include: includeRelacoes
		});
		const order = new Map(ids.map((id, i) => [id, i]));
		rows.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
		return rows;
	},

	listByTenant(tenantId: number, type?: FinanceType) {
		return prisma.lancamentoFinanceiro.findMany({
			where: buildListWhere(tenantId, { type }),
			include: includeRelacoes,
			orderBy: [{ dataVencimento: 'desc' }, { createdAt: 'desc' }]
		});
	},

	listByTenantPaginated(tenantId: number, filters: LancamentoListFilters, skip: number, take: number) {
		return prisma.lancamentoFinanceiro.findMany({
			where: buildListWhere(tenantId, filters),
			include: includeRelacoes,
			orderBy: [{ dataVencimento: 'desc' }, { createdAt: 'desc' }],
			skip,
			take
		});
	},

	countByTenantWithFilters(tenantId: number, filters: LancamentoListFilters) {
		return prisma.lancamentoFinanceiro.count({
			where: buildListWhere(tenantId, filters)
		});
	},

	create(
		tenantId: number,
		data: {
			type: FinanceType;
			valor: Prisma.Decimal;
			dataVencimento: Date;
			dataPagamento: Date | null;
			contaBancariaEmpresaId: number;
			contaBancariaTerceiroId: number | null;
			fornecedorId: number | null;
			clienteId: number | null;
			descricao: string;
			recorrenciaAtiva: boolean;
			recorrenciaTipo: RecurrenceType;
			recorrenciaQuantidade: number;
			observacao: string;
			recorrenciaGrupoId?: string | null;
			recorrenciaParcela?: number | null;
		}
	) {
		return prisma.lancamentoFinanceiro.create({
			data: {
				tenantId,
				type: data.type,
				valor: data.valor,
				dataVencimento: data.dataVencimento,
				dataPagamento: data.dataPagamento,
				contaBancariaEmpresaId: data.contaBancariaEmpresaId,
				contaBancariaTerceiroId: data.contaBancariaTerceiroId,
				fornecedorId: data.fornecedorId,
				clienteId: data.clienteId,
				descricao: data.descricao,
				recorrenciaAtiva: data.recorrenciaAtiva,
				recorrenciaTipo: data.recorrenciaTipo,
				recorrenciaQuantidade: data.recorrenciaQuantidade,
				observacao: data.observacao,
				recorrenciaGrupoId: data.recorrenciaGrupoId ?? null,
				recorrenciaParcela: data.recorrenciaParcela ?? null
			},
			include: includeRelacoes
		});
	},

	createBatch(
		tenantId: number,
		items: Array<{
			type: FinanceType;
			valor: Prisma.Decimal;
			dataVencimento: Date;
			dataPagamento: Date | null;
			contaBancariaEmpresaId: number;
			contaBancariaTerceiroId: number | null;
			fornecedorId: number | null;
			clienteId: number | null;
			descricao: string;
			recorrenciaAtiva: boolean;
			recorrenciaTipo: RecurrenceType;
			recorrenciaQuantidade: number;
			observacao: string;
			recorrenciaGrupoId: string | null;
			recorrenciaParcela: number | null;
		}>
	) {
		return prisma.$transaction(
			items.map((data) =>
				prisma.lancamentoFinanceiro.create({
					data: { tenantId, ...data },
					include: includeRelacoes
				})
			)
		);
	},

	findByIdInTenantAndType(tenantId: number, id: number, type: FinanceType) {
		return prisma.lancamentoFinanceiro.findFirst({
			where: { id, tenantId, type },
			include: includeRelacoes
		});
	},

	/** Busca por id no tenant (sem filtrar tipo) — útil para validar rota contas-a-pagar vs contas-a-receber. */
	findByIdInTenant(tenantId: number, id: number) {
		return prisma.lancamentoFinanceiro.findFirst({
			where: { id, tenantId },
			include: includeRelacoes
		});
	},

	async deleteByIdInTenantAndType(tenantId: number, id: number, type: FinanceType) {
		const row = await prisma.lancamentoFinanceiro.findFirst({
			where: { id, tenantId, type }
		});
		if (!row) {
			return false;
		}
		await prisma.lancamentoFinanceiro.delete({ where: { id } });
		return true;
	},

	/** Efetiva pagamento/recebimento: data e opcionalmente conta de terceiro e observação. */
	async updatePagamentoEfetivado(
		tenantId: number,
		id: number,
		type: FinanceType,
		data: {
			dataPagamento: Date;
			contaBancariaTerceiroId?: number | null;
			observacao?: string;
		}
	) {
		const row = await prisma.lancamentoFinanceiro.findFirst({
			where: { id, tenantId, type }
		});
		if (!row) {
			return null;
		}
		return prisma.lancamentoFinanceiro.update({
			where: { id },
			data: {
				dataPagamento: data.dataPagamento,
				...(data.contaBancariaTerceiroId !== undefined
					? { contaBancariaTerceiroId: data.contaBancariaTerceiroId }
					: {}),
				...(data.observacao !== undefined ? { observacao: data.observacao } : {})
			},
			include: includeRelacoes
		});
	}
};
