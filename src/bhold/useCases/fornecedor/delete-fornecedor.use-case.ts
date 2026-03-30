import { Prisma } from '@prisma/client';
import { HttpError } from '../../http/HttpError';
import { fornecedorRepository } from '../../repositories/fornecedor.repository';
import { parsePositiveInt } from '../../utils/strings';

export async function deleteFornecedorUseCase(tenantId: number, idRaw: unknown) {
	const id = parsePositiveInt(idRaw);
	if (id === null) {
		throw new HttpError(400, 'id inválido');
	}
	try {
		const deleted = await fornecedorRepository.deleteByIdInTenant(tenantId, id);
		if (!deleted) {
			throw new HttpError(404, 'Fornecedor não encontrado');
		}
	} catch (e) {
		if (e instanceof HttpError) {
			throw e;
		}
		if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003') {
			throw new HttpError(409, 'Fornecedor possui lançamentos ou vínculos que impedem a exclusão.');
		}
		throw e;
	}
}
