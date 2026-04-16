import { FormaPagamentoTipo, Prisma } from '@prisma/client';
import { prisma } from '../../infra/db/prisma/client';

type DbClient = Prisma.TransactionClient | typeof prisma;

export const formaPagamentoRepository = {
	listByTenant(tenantId: number) {
		return prisma.formaPagamento.findMany({
			where: { tenantId },
			orderBy: [{ padrao: 'desc' }, { nome: 'asc' }]
		});
	},

	findByIdInTenant(tenantId: number, id: number) {
		return prisma.formaPagamento.findFirst({
			where: { tenantId, id }
		});
	},

	findFirstByTipoInTenant(tenantId: number, tipo: FormaPagamentoTipo, db: DbClient = prisma) {
		return db.formaPagamento.findFirst({
			where: { tenantId, tipo },
			orderBy: [{ padrao: 'desc' }, { id: 'asc' }]
		});
	},

	findByNomeInTenant(tenantId: number, nome: string, excludeId?: number) {
		return prisma.formaPagamento.findFirst({
			where: {
				tenantId,
				nome,
				...(excludeId !== undefined ? { id: { not: excludeId } } : {})
			}
		});
	},

	create(
		tenantId: number,
		data: {
			nome: string;
			tipo: FormaPagamentoTipo;
			contaBancariaEmpresaId?: number | null;
			prazoDias: number | null;
			taxaPercentual: Prisma.Decimal | null;
			ativo: boolean;
			padrao: boolean;
		},
		db: DbClient = prisma
	) {
		return db.formaPagamento.create({
			data: {
				tenantId,
				nome: data.nome,
				tipo: data.tipo,
				contaBancariaEmpresaId: data.contaBancariaEmpresaId ?? null,
				prazoDias: data.prazoDias,
				taxaPercentual: data.taxaPercentual,
				ativo: data.ativo,
				padrao: data.padrao
			}
		});
	},

	async update(
		tenantId: number,
		id: number,
		data: {
			nome: string;
			tipo: FormaPagamentoTipo;
			contaBancariaEmpresaId?: number | null;
			prazoDias: number | null;
			taxaPercentual: Prisma.Decimal | null;
			ativo: boolean;
		}
	) {
		const existing = await prisma.formaPagamento.findFirst({ where: { tenantId, id } });
		if (!existing) {
			return null;
		}
		const contaPadraoPatch =
			data.contaBancariaEmpresaId !== undefined ? { contaBancariaEmpresaId: data.contaBancariaEmpresaId } : {};
		return prisma.formaPagamento.update({
			where: { id },
			data: {
				nome: data.nome,
				tipo: data.tipo,
				...contaPadraoPatch,
				prazoDias: data.prazoDias,
				taxaPercentual: data.taxaPercentual,
				ativo: data.ativo
			}
		});
	},

	async setContaPadrao(
		tenantId: number,
		formaPagamentoId: number,
		contaBancariaEmpresaId: number,
		db: DbClient = prisma
	) {
		const existing = await db.formaPagamento.findFirst({
			where: { tenantId, id: formaPagamentoId }
		});
		if (!existing) {
			return null;
		}
		return db.formaPagamento.update({
			where: { id: formaPagamentoId },
			data: { contaBancariaEmpresaId }
		});
	},

	countLancamentos(tenantId: number, formaPagamentoId: number) {
		return prisma.lancamentoFinanceiro.count({
			where: { tenantId, formaPagamentoId }
		});
	},

	async deleteByIdInTenant(tenantId: number, id: number) {
		const existing = await prisma.formaPagamento.findFirst({ where: { tenantId, id } });
		if (!existing) {
			return 'not_found' as const;
		}
		const n = await prisma.lancamentoFinanceiro.count({
			where: { tenantId, formaPagamentoId: id }
		});
		if (n > 0) {
			return 'has_lancamentos' as const;
		}
		await prisma.formaPagamento.delete({ where: { id } });
		return 'deleted' as const;
	}
};
