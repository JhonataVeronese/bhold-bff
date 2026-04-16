import { FinanceType, Prisma } from '@prisma/client';
import { HttpError } from '../../http/HttpError';
import { lancamentoFinanceiroRepository } from '../../repositories/lancamentoFinanceiro.repository';
import { parseYmdToUtcDate } from '../../utils/dates';
import { str } from '../../utils/strings';
import { mapLancamentoToRow } from './financeiro.mapper';
import { resolveFormaPagamentoLancamento } from './resolve-forma-pagamento-lancamento';

export async function updateLancamentoFinanceiroUseCase(
	tenantId: number,
	idRaw: unknown,
	type: FinanceType,
	body: Record<string, unknown>
) {
	const id = Number(idRaw);
	if (!Number.isInteger(id) || id < 1) {
		throw new HttpError(400, 'id inválido');
	}

	const rowExisting = await lancamentoFinanceiroRepository.findByIdInTenantAndType(tenantId, id, type);
	if (!rowExisting) {
		throw new HttpError(404, 'Lançamento não encontrado');
	}

	const updateData: Parameters<typeof lancamentoFinanceiroRepository.updateByIdInTenantAndType>[3] = {};

	if (Object.prototype.hasOwnProperty.call(body, 'valor')) {
		const valorNum = Number(body.valor);
		if (!Number.isFinite(valorNum) || valorNum <= 0) {
			throw new HttpError(400, 'valor deve ser um número maior que zero');
		}
		updateData.valor = new Prisma.Decimal(String(valorNum));
	}
	if (Object.prototype.hasOwnProperty.call(body, 'dataCompetencia')) {
		updateData.dataCompetencia = parseYmdToUtcDate(body.dataCompetencia);
	}
	if (Object.prototype.hasOwnProperty.call(body, 'dataVencimento')) {
		updateData.dataVencimento = parseYmdToUtcDate(body.dataVencimento);
	}
	if (Object.prototype.hasOwnProperty.call(body, 'dataPagamento')) {
		const raw = body.dataPagamento;
		updateData.dataPagamento = raw === null || String(raw).trim() === '' ? null : parseYmdToUtcDate(raw);
	}

	const shouldUpdateFormaPagamento =
		Object.prototype.hasOwnProperty.call(body, 'formaPagamentoId') ||
		Object.prototype.hasOwnProperty.call(body, 'contaBancariaDestinoId');
	let formaPagamentoTipo = rowExisting.formaPagamento?.tipo ?? null;
	if (shouldUpdateFormaPagamento) {
		const formaPagamentoData = await resolveFormaPagamentoLancamento(
			tenantId,
			rowExisting.contaBancariaEmpresaId,
			body
		);
		updateData.formaPagamentoId = formaPagamentoData.formaPagamentoId;
		updateData.contaBancariaDestinoId = formaPagamentoData.contaBancariaDestinoId;
		formaPagamentoTipo = formaPagamentoData.formaPagamentoTipo;
	}

	if (Object.prototype.hasOwnProperty.call(body, 'numeroDocumento')) {
		updateData.numeroDocumento = str(body.numeroDocumento);
	}
	if (Object.prototype.hasOwnProperty.call(body, 'contaGerencial')) {
		updateData.contaGerencial = str(body.contaGerencial);
	}
	if (Object.prototype.hasOwnProperty.call(body, 'pixChave')) {
		const pixChave = str(body.pixChave);
		if (formaPagamentoTipo !== 'PIX' && pixChave) {
			throw new HttpError(400, 'pixChave só pode ser informada quando a forma de pagamento for PIX');
		}
		updateData.pixChave = pixChave;
	}
	if (Object.prototype.hasOwnProperty.call(body, 'descricao')) {
		updateData.descricao = str(body.descricao);
	}
	if (Object.prototype.hasOwnProperty.call(body, 'observacao')) {
		updateData.observacao = str(body.observacao);
	}

	const updated = await lancamentoFinanceiroRepository.updateByIdInTenantAndType(tenantId, id, type, updateData);
	if (!updated) {
		throw new HttpError(404, 'Lançamento não encontrado');
	}
	return mapLancamentoToRow(updated);
}
