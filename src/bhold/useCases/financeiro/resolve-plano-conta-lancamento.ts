import { FinanceType } from '@prisma/client';
import { HttpError } from '../../http/HttpError';
import { prisma } from '../../../infra/db/prisma/client';
import { parsePositiveInt } from '../../utils/strings';

export async function resolvePlanoContaLancamento(
	tenantId: number,
	type: FinanceType,
	body: Record<string, unknown>
): Promise<{ planoContaId: number | null; contaGerencial: string }> {
	const hasPlanoContaId = Object.prototype.hasOwnProperty.call(body, 'planoContaId');
	const hasContaGerencial = Object.prototype.hasOwnProperty.call(body, 'contaGerencial');

	if (!hasPlanoContaId && !hasContaGerencial) {
		return { planoContaId: null, contaGerencial: '' };
	}

	let planoContaId: number | null = null;
	if (hasPlanoContaId) {
		const raw = body.planoContaId;
		if (raw !== null && raw !== undefined && String(raw).trim() !== '') {
			const parsed = parsePositiveInt(raw);
			if (parsed === null) {
				throw new HttpError(400, 'planoContaId deve ser numérico quando informado');
			}
			planoContaId = parsed;
		}
	}

	if (!planoContaId) {
		const contaGerencial = hasContaGerencial ? String(body.contaGerencial ?? '').trim() : '';
		return { planoContaId: null, contaGerencial };
	}

	const planoConta = await prisma.planoConta.findFirst({
		where: { id: planoContaId, tenantId, ativo: true }
	});
	if (!planoConta) {
		throw new HttpError(400, 'planoContaId não encontrado ou inativo neste tenant');
	}

	const expectedNatureza = type === 'PAYABLE' ? 'DEBITO' : 'CREDITO';
	if (planoConta.natureza !== expectedNatureza) {
		throw new HttpError(
			400,
			`planoContaId inválido para o tipo de lançamento: esperado ${expectedNatureza.toLowerCase()}`
		);
	}

	return {
		planoContaId: planoConta.id,
		contaGerencial: planoConta.descricao
	};
}
