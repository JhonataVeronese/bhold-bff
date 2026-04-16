import { HttpError } from '../../http/HttpError';
import { contaBancariaEmpresaRepository } from '../../repositories/contaBancariaEmpresa.repository';
import { dashboardFinanceiroRepository } from '../../repositories/dashboardFinanceiro.repository';
import { movimentoContaEmpresaRepository } from '../../repositories/movimentoContaEmpresa.repository';
import { formatDateToYmd } from '../../utils/dates';
import { monthBoundsUtcDates } from '../../utils/monthBounds';
import { parsePositiveInt } from '../../utils/strings';

function toGroupedNumberMap<
	Key extends 'contaBancariaEmpresaId' | 'contaBancariaDestinoId',
	Row extends Record<Key, number | null> & { _sum: { valor: { toNumber(): number } | null } }
>(rows: Row[], key: Key): Map<number, number> {
	const map = new Map<number, number>();
	for (const row of rows) {
		const id = row[key];
		if (id === null) {
			continue;
		}
		map.set(id, row._sum.valor?.toNumber() ?? 0);
	}
	return map;
}

function parsePeriodo(query: Record<string, unknown>) {
	const ano = parsePositiveInt(query.ano);
	const mes = parsePositiveInt(query.mes);

	if (!ano || ano < 2000 || ano > 2100) {
		throw new HttpError(400, 'Parâmetro inválido: ano deve estar entre 2000 e 2100.');
	}
	if (!mes || mes < 1 || mes > 12) {
		throw new HttpError(400, 'Parâmetro inválido: mes deve estar entre 1 e 12.');
	}

	const { start, end } = monthBoundsUtcDates(ano, mes);
	return { ano, mes, dataDe: start, dataAte: end };
}

function normalizeOptionalText(value: string | null | undefined): string | null {
	const normalized = String(value ?? '').trim();
	return normalized === '' ? null : normalized;
}

function formatAgencia(agencia: string, agenciaDigito: string | null): string | null {
	const numero = agencia.trim();
	const digito = String(agenciaDigito ?? '').trim();
	if (!numero) {
		return null;
	}
	return digito ? `${numero}-${digito}` : numero;
}

function formatConta(conta: string, contaDigito: string | null): string | null {
	const numero = conta.trim();
	const digito = String(contaDigito ?? '').trim();
	if (!numero) {
		return null;
	}
	return digito ? `${numero}-${digito}` : numero;
}

function buildContaLabel(params: {
	nome: string | null;
	bankFullName: string;
	agencia: string | null;
	conta: string | null;
}): string {
	const bankFullName = params.bankFullName.trim();
	const nome =
		params.nome && params.nome.localeCompare(bankFullName, 'pt-BR', { sensitivity: 'accent' }) === 0
			? null
			: params.nome;
	const parts = [nome, bankFullName];
	if (params.agencia) {
		parts.push(`Ag. ${params.agencia}`);
	}
	if (params.conta) {
		parts.push(params.conta);
	}
	return parts.filter(Boolean).join(' · ');
}

function buildBankKey(params: { bankIspb: string; bankCode: number | null; bankFullName: string }): string {
	const ispb = params.bankIspb.trim();
	if (ispb) {
		return `ispb:${ispb}`;
	}
	const code = params.bankCode === null ? '' : String(params.bankCode);
	return `name:${code}::${params.bankFullName.trim().toUpperCase()}`;
}

function buildBankLabel(params: { bankCode: number | null; bankFullName: string }): string {
	const fullName = params.bankFullName.trim();
	if (params.bankCode !== null) {
		return `${params.bankCode} · ${fullName}`;
	}
	return fullName;
}

type BancoResumo = {
	bankKey: string;
	bankLabel: string;
	bankCode: number | null;
	bankFullName: string;
	totals: {
		aPagarAberto: number;
		aReceberAberto: number;
		saldoAtual: number;
	};
	contas: Array<{
		contaId: string;
		label: string;
		nome: string | null;
		bankCode: number | null;
		bankFullName: string;
		agencia: string | null;
		conta: string | null;
		aPagarAberto: number;
		aReceberAberto: number;
		saldoAtual: number;
	}>;
};

export async function getResumoBancosFinanceiroUseCase(tenantId: number, query: Record<string, unknown>) {
	const periodo = parsePeriodo(query);

	const [
		contas,
		movimentosByConta,
		recebidosByConta,
		pagosByConta,
		transferenciasInByConta,
		aPagarByConta,
		aReceberByConta
	] = await Promise.all([
		contaBancariaEmpresaRepository.listByTenant(tenantId),
		movimentoContaEmpresaRepository.sumByContaUntil(tenantId, periodo.dataAte),
		dashboardFinanceiroRepository.paidByContaUntil(tenantId, 'RECEIVABLE', periodo.dataAte),
		dashboardFinanceiroRepository.paidByContaUntil(tenantId, 'PAYABLE', periodo.dataAte),
		dashboardFinanceiroRepository.transferInByContaUntil(tenantId, periodo.dataAte),
		dashboardFinanceiroRepository.openByContaUntil(tenantId, 'PAYABLE', periodo.dataAte),
		dashboardFinanceiroRepository.openByContaUntil(tenantId, 'RECEIVABLE', periodo.dataAte)
	]);

	const movimentosMap = toGroupedNumberMap(movimentosByConta, 'contaBancariaEmpresaId');
	const recebidosMap = toGroupedNumberMap(recebidosByConta, 'contaBancariaEmpresaId');
	const pagosMap = toGroupedNumberMap(pagosByConta, 'contaBancariaEmpresaId');
	const transferenciasInMap = toGroupedNumberMap(transferenciasInByConta, 'contaBancariaDestinoId');
	const aPagarMap = toGroupedNumberMap(aPagarByConta, 'contaBancariaEmpresaId');
	const aReceberMap = toGroupedNumberMap(aReceberByConta, 'contaBancariaEmpresaId');

	const bancosMap = new Map<string, BancoResumo>();

	for (const conta of contas) {
		const nome = normalizeOptionalText(conta.nome);
		const agencia = formatAgencia(conta.agencia, conta.agenciaDigito);
		const contaNumero = formatConta(conta.conta, conta.contaDigito);
		const aPagarAberto = aPagarMap.get(conta.id) ?? 0;
		const aReceberAberto = aReceberMap.get(conta.id) ?? 0;
		const saldoAtual =
			(movimentosMap.get(conta.id) ?? 0) +
			(recebidosMap.get(conta.id) ?? 0) -
			(pagosMap.get(conta.id) ?? 0) +
			(transferenciasInMap.get(conta.id) ?? 0);
		const bankKey = buildBankKey({
			bankIspb: conta.bankIspb,
			bankCode: conta.bankCode,
			bankFullName: conta.bankFullName
		});
		const bankLabel = buildBankLabel({
			bankCode: conta.bankCode,
			bankFullName: conta.bankFullName
		});

		const contaResumo = {
			contaId: String(conta.id),
			label: buildContaLabel({
				nome,
				bankFullName: conta.bankFullName,
				agencia,
				conta: contaNumero
			}),
			nome,
			bankCode: conta.bankCode,
			bankFullName: conta.bankFullName,
			agencia,
			conta: contaNumero,
			aPagarAberto,
			aReceberAberto,
			saldoAtual
		};

		const existingBank = bancosMap.get(bankKey);
		if (existingBank) {
			existingBank.contas.push(contaResumo);
			existingBank.totals.aPagarAberto += aPagarAberto;
			existingBank.totals.aReceberAberto += aReceberAberto;
			existingBank.totals.saldoAtual += saldoAtual;
			continue;
		}

		bancosMap.set(bankKey, {
			bankKey,
			bankLabel,
			bankCode: conta.bankCode,
			bankFullName: conta.bankFullName,
			totals: {
				aPagarAberto,
				aReceberAberto,
				saldoAtual
			},
			contas: [contaResumo]
		});
	}

	const data = Array.from(bancosMap.values())
		.map((bank) => ({
			...bank,
			contas: bank.contas.sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))
		}))
		.sort((a, b) => a.bankLabel.localeCompare(b.bankLabel, 'pt-BR'));

	return {
		periodo: {
			ano: periodo.ano,
			mes: periodo.mes,
			dataDe: formatDateToYmd(periodo.dataDe),
			dataAte: formatDateToYmd(periodo.dataAte)
		},
		data
	};
}
