import { clienteRepository } from '../../repositories/cliente.repository';
import { mapClienteListItem } from './cliente.mapper';

export async function listClientesUseCase(tenantId: number) {
	const rows = await clienteRepository.listByTenant(tenantId);
	return { data: rows.map(mapClienteListItem) };
}
