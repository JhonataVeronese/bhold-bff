import { FormaPagamentoTipo } from '@prisma/client';
import { prisma } from '../../../infra/db/prisma/client';

type FormaPagamentoPadrao = {
	nome: string;
	tipo: FormaPagamentoTipo;
	prazoDias: number | null;
	taxaPercentual: null;
};

const FORMAS_PAGAMENTO_PADRAO: FormaPagamentoPadrao[] = [
	{ nome: 'PIX', tipo: 'PIX', prazoDias: null, taxaPercentual: null },
	{ nome: 'Dinheiro', tipo: 'DINHEIRO', prazoDias: null, taxaPercentual: null },
	{ nome: 'Transferência', tipo: 'TRANSFERENCIA', prazoDias: null, taxaPercentual: null },
	{ nome: 'Cartão de Crédito', tipo: 'CARTAO_CREDITO', prazoDias: null, taxaPercentual: null },
	{ nome: 'Cartão de Débito', tipo: 'CARTAO_DEBITO', prazoDias: 1, taxaPercentual: null }
];

export async function ensureDefaultFormasPagamentoForTenant(tenantId: number) {
	await prisma.formaPagamento.createMany({
		data: FORMAS_PAGAMENTO_PADRAO.map((item) => ({
			tenantId,
			nome: item.nome,
			tipo: item.tipo,
			prazoDias: item.prazoDias,
			taxaPercentual: item.taxaPercentual,
			ativo: true,
			padrao: true
		})),
		skipDuplicates: true
	});
}
