import { Prisma } from '@prisma/client';
import { fornecedorRepository } from '../../repositories/fornecedor.repository';
import { extractFornecedorCampos, validateFornecedorCreate } from './parse-fornecedor-body';
import { mapFornecedorToResponse } from './fornecedor.mapper';

export async function createFornecedorUseCase(tenantId: number, body: Record<string, unknown>) {
	const extracted = extractFornecedorCampos(body);
	validateFornecedorCreate(extracted);
	const created = await fornecedorRepository.create(tenantId, {
		cnpj: extracted.cnpj,
		razaoSocial: extracted.razaoSocial,
		nomeFantasia: extracted.nomeFantasia,
		municipio: extracted.municipio,
		uf: extracted.uf,
		payload: body as Prisma.InputJsonValue
	});
	return mapFornecedorToResponse(created);
}
