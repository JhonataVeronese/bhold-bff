import { clienteRepository } from '../../repositories/cliente.repository';
import { mapClienteToResponse } from './cliente.mapper';

export async function listClientesUseCase(tenantId: number) {
	const rows = await clienteRepository.listByTenant(tenantId);
	return { data: rows.map(mapClienteToResponse) };
}
