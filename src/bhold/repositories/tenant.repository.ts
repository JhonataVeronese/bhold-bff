import { prisma } from '../../infra/db/prisma/client';

export const tenantRepository = {
	findById(id: number) {
		return prisma.tenant.findUnique({ where: { id } });
	},

	findBySlug(slug: string) {
		return prisma.tenant.findUnique({ where: { slug } });
	},

	findByCnpj(cnpj: string | null | undefined) {
		if (!cnpj) return Promise.resolve(null);
		return prisma.tenant.findUnique({ where: { cnpj } });
	},

	/** Outro tenant já usa este CNPJ (para validação em update). */
	findFirstByCnpjExcludingId(cnpj: string, excludeId: number) {
		return prisma.tenant.findFirst({
			where: {
				cnpj,
				id: { not: excludeId }
			}
		});
	},

	list() {
		return prisma.tenant.findMany({
			orderBy: { createdAt: 'desc' }
		});
	},

	/** Apenas id + nome; exclui tenant interno `system` (login de operadores). */
	listMinimalForPublicLogin(options: { take: number }) {
		return prisma.tenant.findMany({
			where: { slug: { not: 'system' } },
			select: { id: true, nome: true },
			orderBy: { nome: 'asc' },
			take: options.take
		});
	},

	create(input: { nome: string; slug: string; nomeFantasia: string; cnpj: string | null }) {
		return prisma.tenant.create({
			data: {
				nome: input.nome,
				slug: input.slug,
				nomeFantasia: input.nomeFantasia,
				cnpj: input.cnpj
			}
		});
	},

	update(id: number, data: { nome?: string; slug?: string; nomeFantasia?: string; cnpj?: string | null }) {
		return prisma.tenant.update({
			where: { id },
			data
		});
	},

	delete(id: number) {
		return prisma.tenant.delete({
			where: { id }
		});
	}
};
