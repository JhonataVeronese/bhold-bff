import { TipoContaBancaria } from '@prisma/client';
import { prisma } from '../../infra/db/prisma/client';

const includeTerceiro = {
	fornecedor: true,
	cliente: true
} as const;

export const contaBancariaTerceiroRepository = {
	listByTenant(tenantId: number) {
		return prisma.contaBancariaTerceiro.findMany({
			where: { tenantId },
			include: includeTerceiro,
			orderBy: { createdAt: 'desc' }
		});
	},

	findByIdInTenant(tenantId: number, id: number) {
		return prisma.contaBancariaTerceiro.findFirst({
			where: { id, tenantId },
			include: includeTerceiro
		});
	},

	create(
		tenantId: number,
		data: {
			fornecedorId: number | null;
			clienteId: number | null;
			bankIspb: string;
			bankCode: number | null;
			bankFullName: string;
			agencia: string;
			agenciaDigito: string | null;
			conta: string;
			contaDigito: string | null;
			tipoConta: TipoContaBancaria;
			pixChave: string;
		}
	) {
		return prisma.contaBancariaTerceiro.create({
			data: {
				tenantId,
				fornecedorId: data.fornecedorId,
				clienteId: data.clienteId,
				bankIspb: data.bankIspb,
				bankCode: data.bankCode,
				bankFullName: data.bankFullName,
				agencia: data.agencia,
				agenciaDigito: data.agenciaDigito,
				conta: data.conta,
				contaDigito: data.contaDigito,
				tipoConta: data.tipoConta,
				pixChave: data.pixChave
			},
			include: includeTerceiro
		});
	},

	countLancamentosReferenciando(tenantId: number, contaBancariaTerceiroId: number) {
		return prisma.lancamentoFinanceiro.count({
			where: { tenantId, contaBancariaTerceiroId }
		});
	},

	async deleteByIdInTenant(tenantId: number, id: number) {
		const existing = await prisma.contaBancariaTerceiro.findFirst({ where: { id, tenantId } });
		if (!existing) {
			return 'not_found' as const;
		}
		const n = await prisma.lancamentoFinanceiro.count({
			where: { tenantId, contaBancariaTerceiroId: id }
		});
		if (n > 0) {
			return 'has_lancamentos' as const;
		}
		await prisma.contaBancariaTerceiro.delete({ where: { id } });
		return 'deleted' as const;
	}
};
