import type { LancamentoComRelacoes } from '../../repositories/lancamentoFinanceiro.repository';
import { formatDateToYmd } from '../../utils/dates';
import { buildContaBancariaNome, mapLancamentoToRow, typeToJson } from './financeiro.mapper';

export function mapExtratoFinanceiroItem(row: LancamentoComRelacoes) {
	const dataRefDate = row.dataPagamento ?? row.dataVencimento;
	const kind = typeToJson(row.type);

	let contraParte = '';
	if (row.type === 'PAYABLE' && row.fornecedor) {
		contraParte = row.fornecedor.nomeFantasia || row.fornecedor.razaoSocial;
	} else if (row.type === 'RECEIVABLE' && row.cliente) {
		contraParte = row.cliente.nomeFantasia || row.cliente.razaoSocial;
	}

	const contaLabel = buildContaBancariaNome(row.contaBancariaEmpresa);
	const lancamento = mapLancamentoToRow(row);

	return {
		id: `${kind}-${row.id}`,
		lancamentoId: String(row.id),
		kind,
		valor: row.valor.toNumber(),
		dataRef: formatDateToYmd(dataRefDate),
		dataVencimento: formatDateToYmd(row.dataVencimento),
		dataPagamento: row.dataPagamento ? formatDateToYmd(row.dataPagamento) : null,
		situacao: row.dataPagamento ? ('pago' as const) : ('pendente' as const),
		descricao: row.descricao,
		contraParte,
		contaLabel,
		financeAccount: {
			id: String(row.contaBancariaEmpresaId),
			label: contaLabel
		},
		lancamento
	};
}
