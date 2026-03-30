import { contaBancariaTerceiroRepository } from '../../repositories/contaBancariaTerceiro.repository';
import { mapContaBancariaTerceiroRow } from './conta-bancaria.mapper';

export async function listContasBancariasTerceirosUseCase(tenantId: number) {
	const rows = await contaBancariaTerceiroRepository.listByTenant(tenantId);
	return { data: rows.map(mapContaBancariaTerceiroRow) };
}
