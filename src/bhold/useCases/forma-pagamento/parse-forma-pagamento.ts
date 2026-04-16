import { FormaPagamentoTipo, Prisma } from '@prisma/client';
import { HttpError } from '../../http/HttpError';
import { str } from '../../utils/strings';

export function parseFormaPagamentoTipo(v: unknown): FormaPagamentoTipo {
	const s = str(v).toLowerCase();
	if (!s || s === 'outros') return 'OUTROS';
	if (s === 'dinheiro') return 'DINHEIRO';
	if (s === 'pix') return 'PIX';
	if (s === 'transferencia') return 'TRANSFERENCIA';
	if (s === 'cartao_credito' || s === 'cartao-credito' || s === 'credito') return 'CARTAO_CREDITO';
	if (s === 'cartao_debito' || s === 'cartao-debito' || s === 'debito') return 'CARTAO_DEBITO';

	const u = str(v).toUpperCase();
	if (
		u === 'DINHEIRO' ||
		u === 'PIX' ||
		u === 'TRANSFERENCIA' ||
		u === 'CARTAO_CREDITO' ||
		u === 'CARTAO_DEBITO' ||
		u === 'OUTROS'
	) {
		return u as FormaPagamentoTipo;
	}

	throw new HttpError(400, 'tipo deve ser dinheiro, pix, transferencia, cartao_credito, cartao_debito ou outros');
}

export function parsePrazoDias(v: unknown, tipo: FormaPagamentoTipo): number | null {
	if (v === undefined || v === null || str(v) === '') {
		return tipo === 'CARTAO_DEBITO' ? 1 : null;
	}
	const n = Number(v);
	if (!Number.isInteger(n) || n < 0) {
		throw new HttpError(400, 'prazoDias deve ser um número inteiro maior ou igual a zero');
	}
	return n;
}

export function parseTaxaPercentual(v: unknown): Prisma.Decimal | null {
	if (v === undefined || v === null || str(v) === '') {
		return null;
	}
	const n = Number(v);
	if (!Number.isFinite(n) || n < 0) {
		throw new HttpError(400, 'taxaPercentual deve ser um número maior ou igual a zero');
	}
	return new Prisma.Decimal(String(n));
}
