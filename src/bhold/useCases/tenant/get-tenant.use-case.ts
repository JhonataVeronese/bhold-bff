import { HttpError } from '../../http/HttpError';
import { tenantRepository } from '../../repositories/tenant.repository';
import { parsePositiveInt } from '../../utils/strings';
import { mapTenantToResponse } from './tenant.mapper';

export async function getTenantByIdUseCase(idRaw: unknown) {
	const id = parsePositiveInt(idRaw);
	if (id === null) {
		throw new HttpError(400, 'id inválido');
	}
	const tenant = await tenantRepository.findById(id);
	if (!tenant) {
		throw new HttpError(404, 'Tenant não encontrado');
	}
	return mapTenantToResponse(tenant);
}
