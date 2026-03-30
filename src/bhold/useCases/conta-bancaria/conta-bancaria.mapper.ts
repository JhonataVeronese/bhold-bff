import type { Cliente, ContaBancariaEmpresa, ContaBancariaTerceiro, Fornecedor } from '@prisma/client';
import { TipoContaBancaria } from '@prisma/client';
import { HttpError } from '../../http/HttpError';
import { str } from '../../utils/strings';

export function tipoContaToJson(t: TipoContaBancaria): 'corrente' | 'poupanca' | 'pagamento' {
	switch (t) {
		case 'CORRENTE':
			return 'corrente';
		case 'POUPANCA':
			return 'poupanca';
		case 'PAGAMENTO':
			return 'pagamento';
		default:
			return 'corrente';
	}
}

/** Aceita enum Prisma ou JSON do front: corrente | poupanca | pagamento (case-insensitive). */
export function parseTipoConta(v: unknown): TipoContaBancaria {
	const s = str(v).toLowerCase();
	if (s === 'corrente') return 'CORRENTE';
	if (s === 'poupanca') return 'POUPANCA';
	if (s === 'pagamento') return 'PAGAMENTO';
	throw new HttpError(400, 'tipoConta deve ser corrente, poupanca ou pagamento');
}

function formatAgencia(agencia: string, digito?: string | null): string {
	const d = digito?.trim();
	return d ? `${agencia}-${d}` : agencia;
}

function formatConta(conta: string, digito?: string | null): string {
	const d = digito?.trim();
	return d ? `${conta}-${d}` : conta;
}

export function mapContaBancariaEmpresaRow(c: ContaBancariaEmpresa) {
	return {
		id: String(c.id),
		escopo: 'empresa' as const,
		bankFullName: c.bankFullName,
		bankCode: c.bankCode,
		agencia: formatAgencia(c.agencia, c.agenciaDigito),
		conta: formatConta(c.conta, c.contaDigito),
		tipoConta: tipoContaToJson(c.tipoConta),
		cadastradoEm: c.createdAt.toISOString()
	};
}

export type ContaTerceiroComRelacoes = ContaBancariaTerceiro & {
	fornecedor: Fornecedor | null;
	cliente: Cliente | null;
};

export function mapContaBancariaTerceiroRow(r: ContaTerceiroComRelacoes) {
	const tipoTerceiro = r.fornecedorId != null ? ('fornecedor' as const) : ('cliente' as const);
	const terceiroNome =
		tipoTerceiro === 'fornecedor' && r.fornecedor
			? r.fornecedor.nomeFantasia || r.fornecedor.razaoSocial
			: r.cliente
				? r.cliente.nomeFantasia || r.cliente.razaoSocial
				: '';

	return {
		id: String(r.id),
		escopo: 'terceiro' as const,
		tipoTerceiro,
		fornecedorId: r.fornecedorId != null ? String(r.fornecedorId) : null,
		clienteId: r.clienteId != null ? String(r.clienteId) : null,
		terceiroNome,
		bankFullName: r.bankFullName,
		bankCode: r.bankCode,
		agencia: formatAgencia(r.agencia, r.agenciaDigito),
		conta: formatConta(r.conta, r.contaDigito),
		tipoConta: tipoContaToJson(r.tipoConta),
		cadastradoEm: r.createdAt.toISOString()
	};
}
