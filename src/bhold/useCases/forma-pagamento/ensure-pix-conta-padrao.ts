import type { Prisma } from '@prisma/client';
import { formaPagamentoRepository } from '../../repositories/formaPagamento.repository';

type DbClient = Prisma.TransactionClient;

/**
 * Primeira conta bancária real (não Carteira) vira padrão do PIX quando ainda não há conta vinculada.
 */
export async function ensurePixContaPadraoWhenNovaContaBancaria(
	tenantId: number,
	contaBancariaEmpresaId: number,
	nomeConta: string,
	tx: DbClient
) {
	if (nomeConta.trim().toLowerCase() === 'carteira') {
		return;
	}
	const pix = await formaPagamentoRepository.findFirstByTipoInTenant(tenantId, 'PIX', tx);
	if (pix && pix.contaBancariaEmpresaId == null) {
		await formaPagamentoRepository.setContaPadrao(tenantId, pix.id, contaBancariaEmpresaId, tx);
	}
}
