import { FinanceType } from '@prisma/client';
import { HttpError } from '../../http/HttpError';
import { lancamentoFinanceiroRepository } from '../../repositories/lancamentoFinanceiro.repository';
import { parsePositiveInt } from '../../utils/strings';
import { mapLancamentoToRow, typeToJson } from './financeiro.mapper';

export async function getLancamentoFinanceiroByIdUseCase(
	tenantId: number,
	idRaw: unknown,
	type: FinanceType
) {
	const id = parsePositiveInt(idRaw);
	if (id === null) {
		throw new HttpError(400, 'id inválido');
	}

	const row = await lancamentoFinanceiroRepository.findByIdInTenant(tenantId, id);
	if (!row) {
		throw new HttpError(
			404,
			'Lançamento não encontrado neste tenant (confira o id e o header X-Tenant-Id)'
		);
	}

	if (row.type !== type) {
		const atual = typeToJson(row.type);
		const rotaCorreta = atual === 'payable' ? 'contas-a-pagar' : 'contas-a-receber';
		throw new HttpError(
			409,
			`Este lançamento é conta a ${atual === 'payable' ? 'pagar' : 'receber'} (kind: ${atual}). Use GET /${rotaCorreta}/${id}`
		);
	}

	return mapLancamentoToRow(row);
}
