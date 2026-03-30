import { Prisma } from '@prisma/client';
import { HttpError } from '../../http/HttpError';
import { clienteRepository } from '../../repositories/cliente.repository';
import { parsePositiveInt } from '../../utils/strings';

export async function deleteClienteUseCase(tenantId: number, idRaw: unknown) {
	const id = parsePositiveInt(idRaw);
	if (id === null) {
		throw new HttpError(400, 'id inválido');
	}
	try {
		const deleted = await clienteRepository.deleteByIdInTenant(tenantId, id);
		if (!deleted) {
			throw new HttpError(404, 'Cliente não encontrado');
		}
	} catch (e) {
		if (e instanceof HttpError) {
			throw e;
		}
		if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003') {
			throw new HttpError(409, 'Cliente possui lançamentos financeiros vinculados; não é possível excluir.');
		}
		throw e;
	}
}
