import { FinanceType } from '@prisma/client';
import { HttpError } from '../../http/HttpError';
import { contaBancariaTerceiroRepository } from '../../repositories/contaBancariaTerceiro.repository';
import { lancamentoFinanceiroRepository } from '../../repositories/lancamentoFinanceiro.repository';
import { parseYmdToUtcDate } from '../../utils/dates';
import { parsePositiveInt, str } from '../../utils/strings';
import { mapLancamentoToRow } from './financeiro.mapper';
import { resolveFormaPagamentoLancamento } from './resolve-forma-pagamento-lancamento';

/**
 * Registra quitação: `dataPagamento` (YYYY-MM-DD).
 * Opcional: `contaBancariaTerceiroId` (conta do terceiro), `observacao`.
 */
export async function efetivarPagamentoLancamentoUseCase(
	tenantId: number,
	idRaw: unknown,
	type: FinanceType,
	body: Record<string, unknown>
) {
	const id = parsePositiveInt(idRaw);
	if (id === null) {
		throw new HttpError(400, 'id inválido');
	}

	const dataPagamentoRaw = body.dataPagamento;
	if (dataPagamentoRaw === undefined || dataPagamentoRaw === null || String(dataPagamentoRaw).trim() === '') {
		throw new HttpError(400, 'dataPagamento é obrigatório (YYYY-MM-DD)');
	}
	const dataPagamento = parseYmdToUtcDate(dataPagamentoRaw);

	const rowExisting = await lancamentoFinanceiroRepository.findByIdInTenantAndType(tenantId, id, type);
	if (!rowExisting) {
		throw new HttpError(404, 'Lançamento não encontrado');
	}

	const shouldUpdateFormaPagamento =
		Object.prototype.hasOwnProperty.call(body, 'formaPagamentoId') ||
		Object.prototype.hasOwnProperty.call(body, 'contaBancariaDestinoId');
	const formaPagamentoData = shouldUpdateFormaPagamento
		? await resolveFormaPagamentoLancamento(tenantId, rowExisting.contaBancariaEmpresaId, body)
		: null;

	let contaBancariaTerceiroId: number | null | undefined;
	if (Object.prototype.hasOwnProperty.call(body, 'contaBancariaTerceiroId')) {
		const raw = body.contaBancariaTerceiroId;
		if (raw === null || raw === '' || (typeof raw === 'string' && raw.trim() === '')) {
			contaBancariaTerceiroId = null;
		} else {
			const tid = parsePositiveInt(raw);
			if (tid === null) {
				throw new HttpError(400, 'contaBancariaTerceiroId inválido');
			}
			contaBancariaTerceiroId = tid;
		}
	}

	if (contaBancariaTerceiroId !== undefined && contaBancariaTerceiroId !== null) {
		const cbt = await contaBancariaTerceiroRepository.findByIdInTenant(tenantId, contaBancariaTerceiroId);
		if (!cbt) {
			throw new HttpError(400, 'contaBancariaTerceiroId não encontrada neste tenant');
		}
		if (type === 'PAYABLE') {
			if (cbt.fornecedorId == null || cbt.fornecedorId !== rowExisting.fornecedorId) {
				throw new HttpError(400, 'contaBancariaTerceiroId deve ser do mesmo fornecedor do lançamento');
			}
		} else {
			if (cbt.clienteId == null || cbt.clienteId !== rowExisting.clienteId) {
				throw new HttpError(400, 'contaBancariaTerceiroId deve ser do mesmo cliente do lançamento');
			}
		}
	}

	const observacao = str(body.observacao);
	const updated = await lancamentoFinanceiroRepository.updatePagamentoEfetivado(tenantId, id, type, {
		dataPagamento,
		...(formaPagamentoData !== null ? formaPagamentoData : {}),
		...(contaBancariaTerceiroId !== undefined ? { contaBancariaTerceiroId } : {}),
		...(observacao !== '' ? { observacao } : {})
	});
	if (!updated) {
		throw new HttpError(404, 'Lançamento não encontrado');
	}
	return mapLancamentoToRow(updated);
}
