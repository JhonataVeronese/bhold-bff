import { Prisma } from '@prisma/client';
import { prisma } from '../../infra/db/prisma/client';

export const fornecedorRepository = {
	listByTenant(tenantId: number) {
		return prisma.fornecedor.findMany({
			where: { tenantId },
			orderBy: { createdAt: 'desc' }
		});
	},

	findByIdInTenant(tenantId: number, id: number) {
		return prisma.fornecedor.findFirst({
			where: { id, tenantId }
		});
	},

	create(
		tenantId: number,
		data: {
			cnpj: string;
			razaoSocial: string;
			nomeFantasia: string;
			municipio: string;
			uf: string;
			payload: Prisma.InputJsonValue;
		}
	) {
		return prisma.fornecedor.create({
			data: {
				tenantId,
				cnpj: data.cnpj,
				razaoSocial: data.razaoSocial,
				nomeFantasia: data.nomeFantasia,
				municipio: data.municipio,
				uf: data.uf,
				payload: data.payload
			}
		});
	}
};
