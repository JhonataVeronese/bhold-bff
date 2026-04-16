import { HttpError } from '../../http/HttpError';
import { contaBancariaEmpresaRepository } from '../../repositories/contaBancariaEmpresa.repository';
import { formaPagamentoRepository } from '../../repositories/formaPagamento.repository';
import { parsePositiveInt } from '../../utils/strings';

export async function resolveFormaPagamentoLancamento(
	tenantId: number,
	contaBancariaEmpresaId: number,
	body: Record<string, unknown>,
	options?: { allowMissing?: boolean }
) {
	const rawFormaPagamentoId = body.formaPagamentoId;
	const formaPagamentoId = parsePositiveInt(rawFormaPagamentoId);
	if (formaPagamentoId === null) {
		if (options?.allowMissing) {
			return { formaPagamentoId: null, contaBancariaDestinoId: null };
		}
		throw new HttpError(400, 'formaPagamentoId é obrigatório e deve ser numérico');
	}

	const formaPagamento = await formaPagamentoRepository.findByIdInTenant(tenantId, formaPagamentoId);
	if (!formaPagamento || !formaPagamento.ativo) {
		throw new HttpError(400, 'Forma de pagamento não encontrada ou inativa neste tenant');
	}

	let contaBancariaDestinoId: number | null = null;
	const rawContaDestino = body.contaBancariaDestinoId;

	if (formaPagamento.tipo === 'TRANSFERENCIA') {
		contaBancariaDestinoId = parsePositiveInt(rawContaDestino);
		if (contaBancariaDestinoId === null) {
			throw new HttpError(400, 'contaBancariaDestinoId é obrigatório quando a forma de pagamento for transferência');
		}
		if (contaBancariaDestinoId === contaBancariaEmpresaId) {
			throw new HttpError(400, 'contaBancariaDestinoId deve ser diferente da conta de origem');
		}
		const contaDestino = await contaBancariaEmpresaRepository.findByIdInTenant(tenantId, contaBancariaDestinoId);
		if (!contaDestino) {
			throw new HttpError(400, 'contaBancariaDestinoId não encontrada neste tenant');
		}
	} else if (rawContaDestino !== undefined && rawContaDestino !== null && String(rawContaDestino).trim() !== '') {
		throw new HttpError(400, 'contaBancariaDestinoId só pode ser usada com forma de pagamento transferência');
	}

	return {
		formaPagamentoId,
		contaBancariaDestinoId,
		formaPagamentoTipo: formaPagamento.tipo
	};
}
