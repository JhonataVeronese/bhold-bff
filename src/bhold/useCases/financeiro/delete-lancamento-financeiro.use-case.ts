import { FinanceType } from '@prisma/client';
import { HttpError } from '../../http/HttpError';
import { lancamentoFinanceiroRepository } from '../../repositories/lancamentoFinanceiro.repository';
import { parsePositiveInt } from '../../utils/strings';

export async function deleteLancamentoFinanceiroUseCase(
	tenantId: number,
	idRaw: unknown,
	type: FinanceType
) {
	const id = parsePositiveInt(idRaw);
	if (id === null) {
		throw new HttpError(400, 'id inválido');
	}
	const deleted = await lancamentoFinanceiroRepository.deleteByIdInTenantAndType(tenantId, id, type);
	if (!deleted) {
		throw new HttpError(404, 'Lançamento não encontrado');
	}
}
