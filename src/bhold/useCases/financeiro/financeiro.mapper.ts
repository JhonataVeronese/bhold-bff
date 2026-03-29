import type { ContaBancaria } from '@prisma/client';
import { FinanceType, RecurrenceType } from '@prisma/client';
import type { LancamentoComRelacoes } from '../../repositories/lancamentoFinanceiro.repository';
import { formatDateToYmd } from '../../utils/dates';

function formatAgencia(agencia: string, digito?: string | null): string {
	const t = digito?.trim();
	return t ? `${agencia}-${t}` : agencia;
}

function formatConta(conta: string, digito?: string | null): string {
	const t = digito?.trim();
	return t ? `${conta}-${t}` : conta;
}

export function buildContaBancariaNome(conta: ContaBancaria): string {
	const ag = formatAgencia(conta.agencia, conta.agenciaDigito);
	const c = formatConta(conta.conta, conta.contaDigito);
	return `${conta.bankFullName} · Ag. ${ag} · ${c}`;
}

export function typeToJson(value: FinanceType): 'payable' | 'receivable' {
	return value === 'PAYABLE' ? 'payable' : 'receivable';
}

export function recurrenceToJson(r: RecurrenceType): 'unica' | 'mensal' | 'anual' {
	switch (r) {
		case 'UNICA':
			return 'unica';
		case 'MENSAL':
			return 'mensal';
		case 'ANUAL':
			return 'anual';
		default:
			return 'unica';
	}
}

export function mapLancamentoToRow(row: LancamentoComRelacoes) {
	let counterpartyId: number;
	let counterpartyName: string;

	if (row.type === 'PAYABLE') {
		if (row.fornecedorId == null || !row.fornecedor) {
			throw new Error('Lançamento a pagar sem fornecedor vinculado');
		}
		counterpartyId = row.fornecedorId;
		counterpartyName = row.fornecedor.nomeFantasia || row.fornecedor.razaoSocial;
	} else {
		if (row.clienteId == null || !row.cliente) {
			throw new Error('Lançamento a receber sem cliente vinculado');
		}
		counterpartyId = row.clienteId;
		counterpartyName = row.cliente.nome;
	}

	return {
		id: String(row.id),
		kind: typeToJson(row.type),
		valor: row.valor.toNumber(),
		dataVencimento: formatDateToYmd(row.dataVencimento),
		dataPagamento: row.dataPagamento ? formatDateToYmd(row.dataPagamento) : null,
		contaBancariaId: String(row.contaBancariaId),
		contaBancariaNome: buildContaBancariaNome(row.contaBancaria),
		counterpartyId: String(counterpartyId),
		counterpartyName,
		descricao: row.descricao,
		recorrenciaAtiva: row.recorrenciaAtiva,
		recorrenciaTipo: recurrenceToJson(row.recorrenciaTipo),
		recorrenciaQuantidade: row.recorrenciaQuantidade,
		observacao: row.observacao
	};
}
