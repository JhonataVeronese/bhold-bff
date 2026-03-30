import type { ContaBancariaEmpresa, ContaBancariaTerceiro } from '@prisma/client';
import { FinanceType, RecurrenceType } from '@prisma/client';
import type { LancamentoComRelacoes } from '../../repositories/lancamentoFinanceiro.repository';
import { formatDateToYmd } from '../../utils/dates';

type ContaBancoRotulo = Pick<
	ContaBancariaEmpresa,
	'bankFullName' | 'agencia' | 'agenciaDigito' | 'conta' | 'contaDigito'
>;

function formatAgencia(agencia: string, digito?: string | null): string {
	const t = digito?.trim();
	return t ? `${agencia}-${t}` : agencia;
}

function formatConta(conta: string, digito?: string | null): string {
	const t = digito?.trim();
	return t ? `${conta}-${t}` : conta;
}

function buildContaBankLabel(conta: ContaBancoRotulo): string {
	const ag = formatAgencia(conta.agencia, conta.agenciaDigito);
	const c = formatConta(conta.conta, conta.contaDigito);
	return `${conta.bankFullName} · Ag. ${ag} · ${c}`;
}

export function buildContaBancariaNome(conta: ContaBancariaEmpresa): string {
	return buildContaBankLabel(conta);
}

export function buildContaBancariaTerceiroNome(conta: ContaBancariaTerceiro): string {
	return buildContaBankLabel(conta);
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
		counterpartyName = row.cliente.nomeFantasia || row.cliente.razaoSocial;
	}

	const ce = row.contaBancariaEmpresa;
	const ct = row.contaBancariaTerceiro;

	return {
		id: String(row.id),
		kind: typeToJson(row.type),
		valor: row.valor.toNumber(),
		dataVencimento: formatDateToYmd(row.dataVencimento),
		dataPagamento: row.dataPagamento ? formatDateToYmd(row.dataPagamento) : null,
		/** Id da conta da empresa (caixa). Mantém o nome `contaBancariaId` por compatibilidade com clientes antigos. */
		contaBancariaId: String(row.contaBancariaEmpresaId),
		contaBancariaEmpresaId: String(row.contaBancariaEmpresaId),
		contaBancariaNome: buildContaBancariaNome(ce),
		contaBancariaTerceiroId: row.contaBancariaTerceiroId != null ? String(row.contaBancariaTerceiroId) : null,
		contaBancariaTerceiroNome: ct != null ? buildContaBancariaTerceiroNome(ct) : null,
		counterpartyId: String(counterpartyId),
		counterpartyName,
		descricao: row.descricao,
		recorrenciaAtiva: row.recorrenciaAtiva,
		recorrenciaTipo: recurrenceToJson(row.recorrenciaTipo),
		recorrenciaQuantidade: row.recorrenciaQuantidade,
		observacao: row.observacao
	};
}
