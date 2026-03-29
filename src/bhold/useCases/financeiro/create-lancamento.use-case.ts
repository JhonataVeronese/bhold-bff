import { FinanceType, Prisma, RecurrenceType } from '@prisma/client';
import { HttpError } from '../../http/HttpError';
import { clienteRepository } from '../../repositories/cliente.repository';
import { contaBancariaRepository } from '../../repositories/contaBancaria.repository';
import { fornecedorRepository } from '../../repositories/fornecedor.repository';
import { lancamentoFinanceiroRepository } from '../../repositories/lancamentoFinanceiro.repository';
import { parseYmdToUtcDate } from '../../utils/dates';
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

	const contaBancariaId = parsePositiveInt(body.contaBancariaId);
	if (contaBancariaId === null) {
		throw new HttpError(400, 'contaBancariaId é obrigatório e deve ser numérico');
	}

	const conta = await contaBancariaRepository.findByIdInTenant(tenantId, contaBancariaId);
	if (!conta) {
		throw new HttpError(400, 'contaBancariaId não encontrado neste tenant');
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

	const created = await lancamentoFinanceiroRepository.create(tenantId, {
		type,
		valor: new Prisma.Decimal(String(valorNum)),
		dataVencimento,
		dataPagamento,
		contaBancariaId,
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
