import { Prisma } from '@prisma/client';
import { prisma } from '../../../infra/db/prisma/client';
import { contaBancariaEmpresaRepository } from '../../repositories/contaBancariaEmpresa.repository';
import { formaPagamentoRepository } from '../../repositories/formaPagamento.repository';

export async function ensureCarteiraContaForTenant(tenantId: number) {
	return prisma.$transaction(async (tx) => {
		let carteira = await contaBancariaEmpresaRepository.findFirstByNomeInTenant(tenantId, 'Carteira', tx);
		if (!carteira) {
			carteira = await contaBancariaEmpresaRepository.create(
				tenantId,
				{
					nome: 'Carteira',
					bankIspb: '',
					bankCode: null,
					bankFullName: 'Carteira',
					agencia: '',
					agenciaDigito: null,
					conta: '',
					contaDigito: null,
					tipoConta: 'PAGAMENTO',
					pixChave: '',
					dataSaldoInicial: null,
					saldoInicial: new Prisma.Decimal('0')
				},
				tx
			);
		}

		const formaDinheiro = await formaPagamentoRepository.findFirstByTipoInTenant(tenantId, 'DINHEIRO', tx);
		if (formaDinheiro && formaDinheiro.contaBancariaEmpresaId !== carteira.id) {
			await formaPagamentoRepository.setContaPadrao(tenantId, formaDinheiro.id, carteira.id, tx);
		}

		return carteira;
	});
}
