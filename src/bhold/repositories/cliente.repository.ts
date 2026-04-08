import { Prisma } from '@prisma/client';
import { prisma } from '../../infra/db/prisma/client';

type DbClient = Prisma.TransactionClient | typeof prisma;

export const clienteRepository = {
	listByTenant(tenantId: number) {
		return prisma.cliente.findMany({
			where: { tenantId },
			orderBy: { createdAt: 'desc' }
		});
	},

	findByIdInTenant(tenantId: number, id: number) {
		return prisma.cliente.findFirst({
			where: { id, tenantId }
		});
	},

	findByCnpjInTenant(tenantId: number, cnpj: string, excludeId?: number, db: DbClient = prisma) {
		return db.cliente.findFirst({
			where: {
				tenantId,
				cnpj,
				...(excludeId !== undefined ? { id: { not: excludeId } } : {})
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
		return db.cliente.create({
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

	async update(
		tenantId: number,
		id: number,
		data: {
			cnpj: string;
			razaoSocial: string;
			nomeFantasia: string;
			municipio: string;
			uf: string;
			payload: Prisma.InputJsonValue;
		}
	) {
		const existing = await prisma.cliente.findFirst({ where: { id, tenantId } });
		if (!existing) {
			return null;
		}
		return prisma.cliente.update({
			where: { id },
			data: {
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
		const existing = await prisma.cliente.findFirst({ where: { id, tenantId } });
		if (!existing) {
			return false;
		}
		await prisma.cliente.delete({ where: { id } });
		return true;
	}
};
