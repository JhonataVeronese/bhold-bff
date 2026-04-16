import { FormaPagamento, FormaPagamentoTipo } from '@prisma/client';

function tipoToJson(
	tipo: FormaPagamentoTipo
): 'dinheiro' | 'pix' | 'transferencia' | 'cartao_credito' | 'cartao_debito' | 'outros' {
	switch (tipo) {
		case 'DINHEIRO':
			return 'dinheiro';
		case 'PIX':
			return 'pix';
		case 'TRANSFERENCIA':
			return 'transferencia';
		case 'CARTAO_CREDITO':
			return 'cartao_credito';
		case 'CARTAO_DEBITO':
			return 'cartao_debito';
		default:
			return 'outros';
	}
}

export function mapFormaPagamentoToResponse(row: FormaPagamento) {
	return {
		id: String(row.id),
		nome: row.nome,
		tipo: tipoToJson(row.tipo),
		contaBancariaEmpresaId: row.contaBancariaEmpresaId != null ? String(row.contaBancariaEmpresaId) : null,
		prazoDias: row.prazoDias,
		taxaPercentual: row.taxaPercentual ? row.taxaPercentual.toNumber() : null,
		ativo: row.ativo,
		padrao: row.padrao,
		criadoEm: row.createdAt.toISOString(),
		atualizadoEm: row.updatedAt.toISOString()
	};
}
