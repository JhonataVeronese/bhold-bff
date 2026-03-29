import { contaBancariaRepository } from '../../repositories/contaBancaria.repository';
import { mapContaBancariaListItem } from './conta-bancaria.mapper';

export async function listContasBancariasUseCase(tenantId: number) {
	const rows = await contaBancariaRepository.listByTenant(tenantId);
	return { data: rows.map(mapContaBancariaListItem) };
}
