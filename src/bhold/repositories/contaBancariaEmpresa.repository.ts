import { TipoContaBancaria } from '@prisma/client';
import { prisma } from '../../infra/db/prisma/client';

export const contaBancariaEmpresaRepository = {
	listByTenant(tenantId: number) {
		return prisma.contaBancariaEmpresa.findMany({
			where: { tenantId },
			orderBy: { createdAt: 'desc' }
		});
	},

	findByIdInTenant(tenantId: number, id: number) {
		return prisma.contaBancariaEmpresa.findFirst({
			where: { id, tenantId }
		});
	},

	create(
		tenantId: number,
		data: {
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
		return prisma.contaBancariaEmpresa.create({
			data: {
				tenantId,
				bankIspb: data.bankIspb,
				bankCode: data.bankCode,
				bankFullName: data.bankFullName,
				agencia: data.agencia,
				agenciaDigito: data.agenciaDigito,
				conta: data.conta,
				contaDigito: data.contaDigito,
				tipoConta: data.tipoConta,
				pixChave: data.pixChave
			}
		});
	},

	countLancamentos(tenantId: number, contaBancariaEmpresaId: number) {
		return prisma.lancamentoFinanceiro.count({
			where: { tenantId, contaBancariaEmpresaId }
		});
	},

	async deleteByIdInTenant(tenantId: number, id: number) {
		const existing = await prisma.contaBancariaEmpresa.findFirst({ where: { id, tenantId } });
		if (!existing) {
			return 'not_found' as const;
		}
		const n = await prisma.lancamentoFinanceiro.count({
			where: { tenantId, contaBancariaEmpresaId: id }
		});
		if (n > 0) {
			return 'has_lancamentos' as const;
		}
		await prisma.contaBancariaEmpresa.delete({ where: { id } });
		return 'deleted' as const;
	}
};
