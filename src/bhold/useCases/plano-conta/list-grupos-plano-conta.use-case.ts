import { planoContaRepository } from '../../repositories/planoConta.repository';
import { mapGrupoPlanoContaToResponse } from './plano-conta.mapper';

export async function listGruposPlanoContaUseCase(tenantId: number) {
	const rows = await planoContaRepository.listGruposByTenant(tenantId);
	return { data: rows.map(mapGrupoPlanoContaToResponse) };
}
