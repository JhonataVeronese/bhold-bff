import { contaBancariaEmpresaRepository } from '../../repositories/contaBancariaEmpresa.repository';
import { mapContaBancariaEmpresaRow } from './conta-bancaria.mapper';

export async function listContasBancariasEmpresaUseCase(tenantId: number) {
	const rows = await contaBancariaEmpresaRepository.listByTenant(tenantId);
	return { data: rows.map(mapContaBancariaEmpresaRow) };
}
