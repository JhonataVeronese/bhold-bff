import { MovimentoContaTipo, Prisma } from '@prisma/client';
import { prisma } from '../../infra/db/prisma/client';

type DbClient = Prisma.TransactionClient | typeof prisma;

export const movimentoContaEmpresaRepository = {
	create(
		tenantId: number,
		data: {
			contaBancariaEmpresaId: number;
			tipo: MovimentoContaTipo;
			valor: Prisma.Decimal;
			dataMovimento: Date;
			descricao: string;
			observacao: string;
		},
		db: DbClient = prisma
	) {
		return db.movimentoContaEmpresa.create({
			data: {
				tenantId,
				contaBancariaEmpresaId: data.contaBancariaEmpresaId,
				tipo: data.tipo,
				valor: data.valor,
				dataMovimento: data.dataMovimento,
				descricao: data.descricao,
				observacao: data.observacao
			},
			include: {
				contaBancariaEmpresa: true
			}
		});
	},

	listByContaAndPeriodo(tenantId: number, contaBancariaEmpresaId: number, start: Date, end: Date) {
		return prisma.movimentoContaEmpresa.findMany({
			where: {
				tenantId,
				contaBancariaEmpresaId,
				dataMovimento: { gte: start, lte: end }
			},
			include: {
				contaBancariaEmpresa: true
			},
			orderBy: [{ dataMovimento: 'desc' }, { createdAt: 'desc' }]
		});
	},

	async sumByTenantUntil(tenantId: number, end: Date) {
		const r = await prisma.movimentoContaEmpresa.aggregate({
			where: {
				tenantId,
				dataMovimento: { lte: end }
			},
			_sum: { valor: true }
		});
		return r._sum.valor ? r._sum.valor.toNumber() : 0;
	},

	sumByContaUntil(tenantId: number, end: Date) {
		return prisma.movimentoContaEmpresa.groupBy({
			by: ['contaBancariaEmpresaId'],
			where: {
				tenantId,
				dataMovimento: { lte: end }
			},
			_sum: { valor: true }
		});
	}
};
