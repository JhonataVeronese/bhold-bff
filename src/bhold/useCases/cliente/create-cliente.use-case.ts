import { HttpError } from '../../http/HttpError';
import { clienteRepository } from '../../repositories/cliente.repository';
import { str } from '../../utils/strings';
import { mapClienteCreated } from './cliente.mapper';

export async function createClienteUseCase(tenantId: number, body: Record<string, unknown>) {
	const nome = str(body.nome);
	if (!nome) {
		throw new HttpError(400, 'nome é obrigatório');
	}
	const documentoRaw = body.documento;
	const documento = documentoRaw === undefined || documentoRaw === null ? null : str(documentoRaw) || null;

	const created = await clienteRepository.create(tenantId, { nome, documento });
	return mapClienteCreated(created);
}
