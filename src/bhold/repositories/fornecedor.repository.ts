import { Prisma } from '@prisma/client';
import { prisma } from '../../infra/db/prisma/client';

type DbClient = Prisma.TransactionClient | typeof prisma;

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

	findByCnpjInTenant(tenantId: number, cnpj: string, db: DbClient = prisma) {
		return db.fornecedor.findFirst({
			where: {
				tenantId,
				cnpj
			}
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
		},
		db: DbClient = prisma
	) {
		return db.fornecedor.create({
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
	},

	async deleteByIdInTenant(tenantId: number, id: number) {
		const existing = await prisma.fornecedor.findFirst({ where: { id, tenantId } });
		if (!existing) {
			return false;
		}
		await prisma.fornecedor.delete({ where: { id } });
		return true;
	}
};
