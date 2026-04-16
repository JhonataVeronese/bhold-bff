import type { MovimentoContaEmpresa, ContaBancariaEmpresa } from '@prisma/client';
import { formatDateToYmd } from '../../utils/dates';
import { buildContaBancariaNome } from './financeiro.mapper';

type MovimentoContaComConta = MovimentoContaEmpresa & {
	contaBancariaEmpresa: ContaBancariaEmpresa;
};

export function mapMovimentoContaItem(row: MovimentoContaComConta) {
	const contaLabel = buildContaBancariaNome(row.contaBancariaEmpresa);
	return {
		id: `movimento-${row.id}`,
		lancamentoId: null,
		kind: 'movimento' as const,
		valor: row.valor.toNumber(),
		dataRef: formatDateToYmd(row.dataMovimento),
		dataVencimento: formatDateToYmd(row.dataMovimento),
		dataPagamento: formatDateToYmd(row.dataMovimento),
		situacao: 'realizado' as const,
		descricao: row.descricao,
		contraParte: '',
		contaLabel,
		financeAccount: {
			id: String(row.contaBancariaEmpresaId),
			label: contaLabel
		},
		movimento: {
			id: String(row.id),
			tipo: row.tipo.toLowerCase(),
			observacao: row.observacao
		}
	};
}
