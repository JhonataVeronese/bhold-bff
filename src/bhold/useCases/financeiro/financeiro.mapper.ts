import type { ContaBancariaEmpresa, ContaBancariaTerceiro, FormaPagamentoTipo } from '@prisma/client';
import { FinanceType, RecurrenceType } from '@prisma/client';
import type { LancamentoComRelacoes } from '../../repositories/lancamentoFinanceiro.repository';
import { formatDateToYmd } from '../../utils/dates';

type ContaBancoRotulo = {
	nome?: string | null;
	bankFullName: string;
	agencia: string;
	agenciaDigito?: string | null;
	conta: string;
	contaDigito?: string | null;
};

function formatAgencia(agencia: string, digito?: string | null): string {
	const t = digito?.trim();
	return t ? `${agencia}-${t}` : agencia;
}

function formatConta(conta: string, digito?: string | null): string {
	const t = digito?.trim();
	return t ? `${conta}-${t}` : conta;
}

function buildContaBankLabel(conta: ContaBancoRotulo): string {
	if (conta.nome?.trim()) {
		return conta.nome;
	}
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

function formaPagamentoTipoToJson(
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
	const cd = row.contaBancariaDestino;
	const ct = row.contaBancariaTerceiro;
	const fp = row.formaPagamento;

	return {
		id: String(row.id),
		kind: typeToJson(row.type),
		valor: row.valor.toNumber(),
		dataCompetencia: formatDateToYmd(row.dataCompetencia),
		dataVencimento: formatDateToYmd(row.dataVencimento),
		dataPagamento: row.dataPagamento ? formatDateToYmd(row.dataPagamento) : null,
		/** Id da conta da empresa (caixa). Mantém o nome `contaBancariaId` por compatibilidade com clientes antigos. */
		contaBancariaId: String(row.contaBancariaEmpresaId),
		contaBancariaEmpresaId: String(row.contaBancariaEmpresaId),
		contaBancariaNome: buildContaBancariaNome(ce),
		contaBancariaDestinoId: row.contaBancariaDestinoId != null ? String(row.contaBancariaDestinoId) : null,
		contaBancariaDestinoNome: cd != null ? buildContaBancariaNome(cd) : null,
		contaBancariaTerceiroId: row.contaBancariaTerceiroId != null ? String(row.contaBancariaTerceiroId) : null,
		contaBancariaTerceiroNome: ct != null ? buildContaBancariaTerceiroNome(ct) : null,
		formaPagamentoId: row.formaPagamentoId != null ? String(row.formaPagamentoId) : null,
		formaPagamentoNome: fp?.nome ?? null,
		formaPagamentoTipo: fp ? formaPagamentoTipoToJson(fp.tipo) : null,
		counterpartyId: String(counterpartyId),
		counterpartyName,
		numeroDocumento: row.numeroDocumento,
		planoContaId: row.planoContaId != null ? String(row.planoContaId) : null,
		planoContaDescricao: row.planoConta?.descricao ?? null,
		planoContaNatureza: row.planoConta?.natureza ?? null,
		planoContaGrupoCodigo: row.planoConta?.grupo.codigo ?? null,
		planoContaGrupoDescricao: row.planoConta?.grupo.descricao ?? null,
		planoContaGrupoNivel: row.planoConta?.grupo.nivel ?? null,
		contaGerencial: row.contaGerencial,
		pixChave: row.pixChave,
		descricao: row.descricao,
		recorrenciaAtiva: row.recorrenciaAtiva,
		recorrenciaTipo: recurrenceToJson(row.recorrenciaTipo),
		recorrenciaQuantidade: row.recorrenciaQuantidade,
		recorrenciaGrupoId: row.recorrenciaGrupoId,
		recorrenciaParcela: row.recorrenciaParcela,
		observacao: row.observacao
	};
}
