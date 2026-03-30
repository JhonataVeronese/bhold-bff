import { Prisma } from '@prisma/client';
import { HttpError } from '../../http/HttpError';
import { clienteRepository } from '../../repositories/cliente.repository';
import { extractFornecedorCampos, validateFornecedorCreate } from '../fornecedor/parse-fornecedor-body';
import { parsePositiveInt } from '../../utils/strings';
import { mapClienteToResponse } from './cliente.mapper';

export async function updateClienteUseCase(tenantId: number, idRaw: unknown, body: Record<string, unknown>) {
	const id = parsePositiveInt(idRaw);
	if (id === null) {
		throw new HttpError(400, 'id inválido');
	}
	const extracted = extractFornecedorCampos(body);
	validateFornecedorCreate(extracted);
	try {
		const updated = await clienteRepository.update(tenantId, id, {
			cnpj: extracted.cnpj,
			razaoSocial: extracted.razaoSocial,
			nomeFantasia: extracted.nomeFantasia,
			municipio: extracted.municipio,
			uf: extracted.uf,
			payload: body as Prisma.InputJsonValue
		});
		if (!updated) {
			throw new HttpError(404, 'Cliente não encontrado');
		}
		return mapClienteToResponse(updated);
	} catch (e) {
		if (e instanceof HttpError) {
			throw e;
		}
		if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
			throw new HttpError(409, 'Já existe cliente com este CNPJ neste tenant');
		}
		throw e;
	}
}
