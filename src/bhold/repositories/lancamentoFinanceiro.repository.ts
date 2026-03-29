import { FinanceType, Prisma, RecurrenceType } from '@prisma/client';
import { prisma } from '../../infra/db/prisma/client';

const includeRelacoes = {
	contaBancaria: true,
	fornecedor: true,
	cliente: true
} satisfies Prisma.LancamentoFinanceiroInclude;

export type LancamentoComRelacoes = Prisma.LancamentoFinanceiroGetPayload<{
	include: typeof includeRelacoes;
}>;

export const lancamentoFinanceiroRepository = {
	listByTenant(tenantId: number, type?: FinanceType) {
		return prisma.lancamentoFinanceiro.findMany({
			where: {
				tenantId,
				...(type !== undefined ? { type } : {})
			},
			include: includeRelacoes,
			orderBy: [{ dataVencimento: 'desc' }, { createdAt: 'desc' }]
		});
	},

	create(
		tenantId: number,
		data: {
			type: FinanceType;
			valor: Prisma.Decimal;
			dataVencimento: Date;
			dataPagamento: Date | null;
			contaBancariaId: number;
			fornecedorId: number | null;
			clienteId: number | null;
			descricao: string;
			recorrenciaAtiva: boolean;
			recorrenciaTipo: RecurrenceType;
			recorrenciaQuantidade: number;
			observacao: string;
		}
	) {
		return prisma.lancamentoFinanceiro.create({
			data: {
				tenantId,
				type: data.type,
				valor: data.valor,
				dataVencimento: data.dataVencimento,
				dataPagamento: data.dataPagamento,
				contaBancariaId: data.contaBancariaId,
				fornecedorId: data.fornecedorId,
				clienteId: data.clienteId,
				descricao: data.descricao,
				recorrenciaAtiva: data.recorrenciaAtiva,
				recorrenciaTipo: data.recorrenciaTipo,
				recorrenciaQuantidade: data.recorrenciaQuantidade,
				observacao: data.observacao
			},
			include: includeRelacoes
		});
	}
};
