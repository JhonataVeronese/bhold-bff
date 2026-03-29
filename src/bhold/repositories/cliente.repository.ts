import { prisma } from '../../infra/db/prisma/client';

export const clienteRepository = {
	listByTenant(tenantId: number) {
		return prisma.cliente.findMany({
			where: { tenantId },
			orderBy: { nome: 'asc' }
		});
	},

	findByIdInTenant(tenantId: number, id: number) {
		return prisma.cliente.findFirst({
			where: { id, tenantId }
		});
	},

	create(tenantId: number, data: { nome: string; documento: string | null }) {
		return prisma.cliente.create({
			data: {
				tenantId,
				nome: data.nome,
				documento: data.documento
			}
		});
	}
};
