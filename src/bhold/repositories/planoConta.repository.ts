import { PlanoContaNatureza, Prisma } from '@prisma/client';
import { prisma } from '../../infra/db/prisma/client';

type PlanoContaListFilters = {
	natureza?: PlanoContaNatureza;
	grupoId?: number;
	ativo?: boolean;
};

export const planoContaRepository = {
	listGruposByTenant(tenantId: number) {
		return prisma.grupoPlanoConta.findMany({
			where: { tenantId },
			include: { parent: true },
			orderBy: [{ nivel: 'asc' }, { codigo: 'asc' }]
		});
	},

	findGrupoByIdInTenant(tenantId: number, id: number) {
		return prisma.grupoPlanoConta.findFirst({
			where: { tenantId, id },
			include: { parent: true }
		});
	},

	findGrupoByCodigoInTenant(tenantId: number, codigo: string, excludeId?: number) {
		return prisma.grupoPlanoConta.findFirst({
			where: {
				tenantId,
				codigo,
				...(excludeId !== undefined ? { id: { not: excludeId } } : {})
			}
		});
	},

	createGrupo(
		tenantId: number,
		data: {
			codigo: string;
			descricao: string;
			nivel: number;
			parentId: number | null;
		}
	) {
		return prisma.grupoPlanoConta.create({
			data: {
				tenantId,
				codigo: data.codigo,
				descricao: data.descricao,
				nivel: data.nivel,
				parentId: data.parentId
			},
			include: { parent: true }
		});
	},

	async updateGrupo(
		tenantId: number,
		id: number,
		data: {
			codigo: string;
			descricao: string;
			nivel: number;
			parentId: number | null;
		}
	) {
		const existing = await prisma.grupoPlanoConta.findFirst({ where: { tenantId, id } });
		if (!existing) return null;
		return prisma.grupoPlanoConta.update({
			where: { id },
			data: {
				codigo: data.codigo,
				descricao: data.descricao,
				nivel: data.nivel,
				parentId: data.parentId
			},
			include: { parent: true }
		});
	},

	countGrupoChildren(tenantId: number, id: number) {
		return prisma.grupoPlanoConta.count({
			where: { tenantId, parentId: id }
		});
	},

	countContasByGrupo(tenantId: number, grupoId: number) {
		return prisma.planoConta.count({
			where: { tenantId, grupoId }
		});
	},

	async deleteGrupoByIdInTenant(tenantId: number, id: number) {
		const existing = await prisma.grupoPlanoConta.findFirst({ where: { tenantId, id } });
		if (!existing) return 'not_found' as const;
		if (existing.systemDefault) return 'system_default' as const;

		const children = await this.countGrupoChildren(tenantId, id);
		if (children > 0) return 'has_children' as const;

		const contas = await this.countContasByGrupo(tenantId, id);
		if (contas > 0) return 'has_contas' as const;

		await prisma.grupoPlanoConta.delete({ where: { id } });
		return 'deleted' as const;
	},

	listContasByTenant(tenantId: number, filters: PlanoContaListFilters = {}) {
		return prisma.planoConta.findMany({
			where: {
				tenantId,
				...(filters.natureza !== undefined ? { natureza: filters.natureza } : {}),
				...(filters.grupoId !== undefined ? { grupoId: filters.grupoId } : {}),
				...(filters.ativo !== undefined ? { ativo: filters.ativo } : {})
			},
			include: {
				grupo: true
			},
			orderBy: [{ natureza: 'asc' }, { descricao: 'asc' }]
		});
	},

	findContaByIdInTenant(tenantId: number, id: number) {
		return prisma.planoConta.findFirst({
			where: { tenantId, id },
			include: { grupo: true }
		});
	},

	createConta(
		tenantId: number,
		data: {
			descricao: string;
			natureza: PlanoContaNatureza;
			grupoId: number;
			ativo: boolean;
		}
	) {
		return prisma.planoConta.create({
			data: {
				tenantId,
				descricao: data.descricao,
				natureza: data.natureza,
				grupoId: data.grupoId,
				ativo: data.ativo
			},
			include: { grupo: true }
		});
	},

	async updateConta(
		tenantId: number,
		id: number,
		data: {
			descricao: string;
			natureza: PlanoContaNatureza;
			grupoId: number;
			ativo: boolean;
		}
	) {
		const existing = await prisma.planoConta.findFirst({ where: { tenantId, id } });
		if (!existing) return null;
		return prisma.planoConta.update({
			where: { id },
			data: {
				descricao: data.descricao,
				natureza: data.natureza,
				grupoId: data.grupoId,
				ativo: data.ativo
			},
			include: { grupo: true }
		});
	},

	countLancamentosByPlanoConta(tenantId: number, planoContaId: number) {
		return prisma.lancamentoFinanceiro.count({
			where: { tenantId, planoContaId }
		});
	},

	async deleteContaByIdInTenant(tenantId: number, id: number) {
		const existing = await prisma.planoConta.findFirst({ where: { tenantId, id } });
		if (!existing) return 'not_found' as const;
		if (existing.systemDefault) return 'system_default' as const;

		const lancamentos = await this.countLancamentosByPlanoConta(tenantId, id);
		if (lancamentos > 0) return 'has_lancamentos' as const;

		await prisma.planoConta.delete({ where: { id } });
		return 'deleted' as const;
	}
};
