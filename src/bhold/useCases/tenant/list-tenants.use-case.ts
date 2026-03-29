import { tenantRepository } from '../../repositories/tenant.repository';
import { mapTenantToResponse } from './tenant.mapper';

export async function listTenantsUseCase() {
	const rows = await tenantRepository.list();
	return { data: rows.map(mapTenantToResponse) };
}
