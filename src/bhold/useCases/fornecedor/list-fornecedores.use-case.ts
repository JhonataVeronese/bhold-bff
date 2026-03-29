import { fornecedorRepository } from '../../repositories/fornecedor.repository';
import { mapFornecedorToResponse } from './fornecedor.mapper';

export async function listFornecedoresUseCase(tenantId: number) {
	const rows = await fornecedorRepository.listByTenant(tenantId);
	return { data: rows.map(mapFornecedorToResponse) };
}
