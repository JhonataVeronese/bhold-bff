import type { ContaBancaria, Fornecedor } from '@prisma/client';
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

export function mapContaBancariaListItem(r: ContaBancaria & { fornecedor: Fornecedor }) {
	return {
		id: String(r.id),
		fornecedorId: String(r.fornecedorId),
		fornecedorNome: r.fornecedor.nomeFantasia || r.fornecedor.razaoSocial,
		bankFullName: r.bankFullName,
		bankCode: r.bankCode,
		agencia: formatAgencia(r.agencia, r.agenciaDigito),
		conta: formatConta(r.conta, r.contaDigito),
		tipoConta: tipoContaToJson(r.tipoConta),
		cadastradoEm: r.createdAt.toISOString()
	};
}

export function mapContaBancariaCreated(created: ContaBancaria & { fornecedor: Fornecedor }) {
	return {
		id: String(created.id),
		fornecedorId: String(created.fornecedorId),
		fornecedorNome: created.fornecedor.nomeFantasia || created.fornecedor.razaoSocial,
		bankFullName: created.bankFullName,
		bankCode: created.bankCode,
		agencia: formatAgencia(created.agencia, created.agenciaDigito),
		conta: formatConta(created.conta, created.contaDigito),
		tipoConta: tipoContaToJson(created.tipoConta),
		cadastradoEm: created.createdAt.toISOString()
	};
}
