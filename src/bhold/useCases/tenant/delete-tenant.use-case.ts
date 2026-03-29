import { HttpError } from '../../http/HttpError';
import { tenantRepository } from '../../repositories/tenant.repository';
import { parsePositiveInt } from '../../utils/strings';

export async function deleteTenantUseCase(idRaw: unknown) {
	const id = parsePositiveInt(idRaw);
	if (id === null) {
		throw new HttpError(400, 'id inválido');
	}
	const current = await tenantRepository.findById(id);
	if (!current) {
		throw new HttpError(404, 'Tenant não encontrado');
	}
	await tenantRepository.delete(id);
}
