import { TipoContaBancaria } from '@prisma/client';
import { prisma } from '../../infra/db/prisma/client';

export const contaBancariaRepository = {
	listByTenant(tenantId: number) {
		return prisma.contaBancaria.findMany({
			where: { tenantId },
			include: { fornecedor: true },
			orderBy: { createdAt: 'desc' }
		});
	},

	findByIdInTenant(tenantId: number, id: number) {
		return prisma.contaBancaria.findFirst({
			where: { id, tenantId }
		});
	},

	create(
		tenantId: number,
		data: {
			fornecedorId: number;
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
		return prisma.contaBancaria.create({
			data: {
				tenantId,
				fornecedorId: data.fornecedorId,
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
			include: { fornecedor: true }
		});
	}
};
