import { HttpError } from '../../http/HttpError';
import { planoContaRepository } from '../../repositories/planoConta.repository';
import { mapPlanoContaToResponse } from './plano-conta.mapper';
import { parsePlanoContaPayload } from './plano-conta.parsers';

export async function createPlanoContaUseCase(tenantId: number, body: Record<string, unknown>) {
	const parsed = parsePlanoContaPayload(body);
	const grupo = await planoContaRepository.findGrupoByIdInTenant(tenantId, parsed.grupoId);
	if (!grupo) throw new HttpError(400, 'grupoId não encontrado neste tenant');

	const created = await planoContaRepository.createConta(tenantId, parsed);
	return mapPlanoContaToResponse(created);
}
