import { Prisma } from '@prisma/client';
import { HttpError } from '../../http/HttpError';
import { clienteRepository } from '../../repositories/cliente.repository';
import { fornecedorRepository } from '../../repositories/fornecedor.repository';
import { prisma } from '../../../infra/db/prisma/client';
import { extractFornecedorCampos, parseReplicarCadastroFlag, validateFornecedorCreate } from './parse-fornecedor-body';
import { mapFornecedorToResponse } from './fornecedor.mapper';

export async function createFornecedorUseCase(tenantId: number, body: Record<string, unknown>) {
	const extracted = extractFornecedorCampos(body);
	const cnpj = extracted.cnpj;
	const replicarCadastro = parseReplicarCadastroFlag(body);
	validateFornecedorCreate(extracted);
	const fornecedorData = {
		cnpj,
		razaoSocial: extracted.razaoSocial,
		nomeFantasia: extracted.nomeFantasia,
		municipio: extracted.municipio,
		uf: extracted.uf,
		payload: body as Prisma.InputJsonValue
	};
	try {
		const created = await prisma.$transaction(async (tx) => {
			const novoFornecedor = await fornecedorRepository.create(tenantId, fornecedorData, tx);

			if (replicarCadastro) {
				const clienteExistente = await clienteRepository.findByCnpjInTenant(tenantId, cnpj, undefined, tx);
				if (!clienteExistente) {
					try {
						await clienteRepository.create(tenantId, fornecedorData, tx);
					} catch (e) {
						if (!(e instanceof Prisma.PrismaClientKnownRequestError) || e.code !== 'P2002') {
							throw e;
						}
					}
				}
			}

			return novoFornecedor;
		});

		return mapFornecedorToResponse(created);
	} catch (e) {
		if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
			throw new HttpError(409, 'Já existe fornecedor com este CNPJ neste tenant');
		}
		throw e;
	}
}
