import { Prisma, TipoContaBancaria } from '@prisma/client';
import { prisma } from '../../infra/db/prisma/client';

type DbClient = Prisma.TransactionClient | typeof prisma;

export const contaBancariaEmpresaRepository = {
	listByTenant(tenantId: number) {
		return prisma.contaBancariaEmpresa.findMany({
			where: { tenantId },
			orderBy: { createdAt: 'desc' }
		});
	},

	findFirstByNomeInTenant(tenantId: number, nome: string, db: DbClient = prisma) {
		return db.contaBancariaEmpresa.findFirst({
			where: { tenantId, nome }
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
			nome: string;
			dataSaldoInicial: Date | null;
			saldoInicial: Prisma.Decimal | null;
		},
		db: DbClient = prisma
	) {
		return db.contaBancariaEmpresa.create({
			data: {
				tenantId,
				nome: data.nome,
				bankIspb: data.bankIspb,
				bankCode: data.bankCode,
				bankFullName: data.bankFullName,
				agencia: data.agencia,
				agenciaDigito: data.agenciaDigito,
				conta: data.conta,
				contaDigito: data.contaDigito,
				tipoConta: data.tipoConta,
				pixChave: data.pixChave,
				dataSaldoInicial: data.dataSaldoInicial,
				saldoInicial: data.saldoInicial
			}
		});
	},

	countLancamentos(tenantId: number, contaBancariaEmpresaId: number) {
		return prisma.lancamentoFinanceiro.count({
			where: {
				tenantId,
				OR: [{ contaBancariaEmpresaId }, { contaBancariaDestinoId: contaBancariaEmpresaId }]
			}
		});
	},

	async deleteByIdInTenant(tenantId: number, id: number) {
		const existing = await prisma.contaBancariaEmpresa.findFirst({ where: { id, tenantId } });
		if (!existing) {
			return 'not_found' as const;
		}
		const n = await prisma.lancamentoFinanceiro.count({
			where: {
				tenantId,
				OR: [{ contaBancariaEmpresaId: id }, { contaBancariaDestinoId: id }]
			}
		});
		const movimentos = await prisma.movimentoContaEmpresa.count({
			where: { tenantId, contaBancariaEmpresaId: id }
		});
		const formas = await prisma.formaPagamento.count({
			where: { tenantId, contaBancariaEmpresaId: id }
		});
		if (n > 0 || movimentos > 0 || formas > 0) {
			return 'has_lancamentos' as const;
		}
		await prisma.contaBancariaEmpresa.delete({ where: { id } });
		return 'deleted' as const;
	}
};
