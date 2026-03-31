import { randomUUID } from 'crypto';
import { FinanceType, Prisma, RecurrenceType } from '@prisma/client';
import { HttpError } from '../../http/HttpError';
import { clienteRepository } from '../../repositories/cliente.repository';
import { contaBancariaEmpresaRepository } from '../../repositories/contaBancariaEmpresa.repository';
import { contaBancariaTerceiroRepository } from '../../repositories/contaBancariaTerceiro.repository';
import { fornecedorRepository } from '../../repositories/fornecedor.repository';
import { lancamentoFinanceiroRepository } from '../../repositories/lancamentoFinanceiro.repository';
import { addMonthsUtc, addYearsUtc, parseYmdToUtcDate } from '../../utils/dates';
import { parsePositiveInt, str } from '../../utils/strings';
import { mapLancamentoToRow } from './financeiro.mapper';
import { parseFinanceType, parseRecurrenceKind } from './financeiro-parsers';

export async function createLancamentoUseCase(
	tenantId: number,
	body: Record<string, unknown>,
	forcedType?: FinanceType
) {
	const type = forcedType ?? parseFinanceType(body.kind ?? body.type);

	const valorNum = Number(body.valor);
	if (!Number.isFinite(valorNum) || valorNum <= 0) {
		throw new HttpError(400, 'valor deve ser um número maior que zero');
	}

	const dataVencimento = parseYmdToUtcDate(body.dataVencimento);
	let dataPagamento: Date | null = null;
	if (body.dataPagamento !== undefined && body.dataPagamento !== null && String(body.dataPagamento).trim() !== '') {
		dataPagamento = parseYmdToUtcDate(body.dataPagamento);
	}

	const contaEmpresaRaw = body.contaBancariaEmpresaId ?? body.contaBancariaId;
	const contaBancariaEmpresaId = parsePositiveInt(contaEmpresaRaw);
	if (contaBancariaEmpresaId === null) {
		throw new HttpError(
			400,
			'contaBancariaEmpresaId (ou contaBancariaId legado) é obrigatório: id da conta bancária da própria empresa'
		);
	}

	const conta = await contaBancariaEmpresaRepository.findByIdInTenant(tenantId, contaBancariaEmpresaId);
	if (!conta) {
		throw new HttpError(
			400,
			'Conta da empresa não encontrada neste tenant (use uma conta cadastrada em GET /contas-bancarias/empresa)'
		);
	}

	const counterpartyId = parsePositiveInt(body.counterpartyId);
	if (counterpartyId === null) {
		throw new HttpError(400, 'counterpartyId é obrigatório e deve ser numérico');
	}

	let fornecedorId: number | null = null;
	let clienteId: number | null = null;

	if (type === 'PAYABLE') {
		const f = await fornecedorRepository.findByIdInTenant(tenantId, counterpartyId);
		if (!f) {
			throw new HttpError(400, 'Fornecedor (counterpartyId) não encontrado neste tenant');
		}
		fornecedorId = f.id;
	} else {
		const c = await clienteRepository.findByIdInTenant(tenantId, counterpartyId);
		if (!c) {
			throw new HttpError(400, 'Cliente (counterpartyId) não encontrado neste tenant');
		}
		clienteId = c.id;
	}

	let contaBancariaTerceiroId: number | null = null;
	const terceiroRaw = body.contaBancariaTerceiroId;
	if (terceiroRaw !== undefined && terceiroRaw !== null && String(terceiroRaw).trim() !== '') {
		const tid = parsePositiveInt(terceiroRaw);
		if (tid === null) {
			throw new HttpError(400, 'contaBancariaTerceiroId deve ser numérico quando informado');
		}
		const cbt = await contaBancariaTerceiroRepository.findByIdInTenant(tenantId, tid);
		if (!cbt) {
			throw new HttpError(400, 'contaBancariaTerceiroId não encontrada neste tenant');
		}
		if (type === 'PAYABLE') {
			if (cbt.fornecedorId == null || cbt.fornecedorId !== fornecedorId) {
				throw new HttpError(
					400,
					'contaBancariaTerceiroId deve ser uma conta bancária cadastrada para o mesmo fornecedor do lançamento'
				);
			}
		} else {
			if (cbt.clienteId == null || cbt.clienteId !== clienteId) {
				throw new HttpError(
					400,
					'contaBancariaTerceiroId deve ser uma conta bancária cadastrada para o mesmo cliente do lançamento'
				);
			}
		}
		contaBancariaTerceiroId = tid;
	}

	const descricao = str(body.descricao);
	const observacao = str(body.observacao);
	const recorrenciaAtiva = Boolean(body.recorrenciaAtiva);

	let recorrenciaTipo: RecurrenceType;
	let recorrenciaQuantidade: number;

	if (!recorrenciaAtiva) {
		recorrenciaTipo = 'UNICA';
		recorrenciaQuantidade = 1;
	} else {
		recorrenciaTipo = parseRecurrenceKind(body.recorrenciaTipo);
		recorrenciaQuantidade = Number(body.recorrenciaQuantidade);
		if (!Number.isInteger(recorrenciaQuantidade) || recorrenciaQuantidade < 1) {
			throw new HttpError(400, 'recorrenciaQuantidade deve ser inteiro ≥ 1');
		}
		if (recorrenciaTipo === 'UNICA') {
			recorrenciaQuantidade = 1;
		}
	}

	const expandirSerieRecorrente =
		recorrenciaAtiva && recorrenciaQuantidade > 1 && (recorrenciaTipo === 'MENSAL' || recorrenciaTipo === 'ANUAL');

	if (expandirSerieRecorrente) {
		const grupoId = randomUUID();
		const valorParcela = new Prisma.Decimal(String(valorNum));
		const datasVencimento: Date[] = [];
		for (let i = 0; i < recorrenciaQuantidade; i++) {
			if (recorrenciaTipo === 'MENSAL') {
				datasVencimento.push(addMonthsUtc(dataVencimento, i));
			} else {
				datasVencimento.push(addYearsUtc(dataVencimento, i));
			}
		}

		const batch = datasVencimento.map((dataVenc, i) => ({
			type,
			valor: valorParcela,
			dataVencimento: dataVenc,
			dataPagamento: null as Date | null,
			contaBancariaEmpresaId,
			contaBancariaTerceiroId,
			fornecedorId,
			clienteId,
			descricao,
			recorrenciaAtiva: false,
			recorrenciaTipo,
			recorrenciaQuantidade,
			observacao,
			recorrenciaGrupoId: grupoId,
			recorrenciaParcela: i + 1
		}));

		const created = await lancamentoFinanceiroRepository.createBatch(tenantId, batch);
		return {
			data: created.map(mapLancamentoToRow),
			recorrenciaGrupoId: grupoId
		};
	}

	const created = await lancamentoFinanceiroRepository.create(tenantId, {
		type,
		valor: new Prisma.Decimal(String(valorNum)),
		dataVencimento,
		dataPagamento,
		contaBancariaEmpresaId,
		contaBancariaTerceiroId,
		fornecedorId,
		clienteId,
		descricao,
		recorrenciaAtiva,
		recorrenciaTipo,
		recorrenciaQuantidade,
		observacao
	});

	return mapLancamentoToRow(created);
}
