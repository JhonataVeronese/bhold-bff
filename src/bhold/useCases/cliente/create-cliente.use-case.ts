import { Prisma } from '@prisma/client';
import { HttpError } from '../../http/HttpError';
import { clienteRepository } from '../../repositories/cliente.repository';
import { fornecedorRepository } from '../../repositories/fornecedor.repository';
import { prisma } from '../../../infra/db/prisma/client';
import {
	extractFornecedorCampos,
	parseReplicarCadastroFlag,
	validateFornecedorCreate
} from '../fornecedor/parse-fornecedor-body';
import { mapClienteToResponse } from './cliente.mapper';

export async function createClienteUseCase(tenantId: number, body: Record<string, unknown>) {
	const extracted = extractFornecedorCampos(body);
	const replicarCadastro = parseReplicarCadastroFlag(body);
	validateFornecedorCreate(extracted);
	try {
		const created = await prisma.$transaction(async (tx) => {
			const novoCliente = await clienteRepository.create(
				tenantId,
				{
					cnpj: extracted.cnpj,
					razaoSocial: extracted.razaoSocial,
					nomeFantasia: extracted.nomeFantasia,
					municipio: extracted.municipio,
					uf: extracted.uf,
					payload: body as Prisma.InputJsonValue
				},
				tx
			);

			if (replicarCadastro) {
				const fornecedorExistente = await fornecedorRepository.findByCnpjInTenant(tenantId, extracted.cnpj, tx);
				if (!fornecedorExistente) {
					try {
						await fornecedorRepository.create(
							tenantId,
							{
								cnpj: extracted.cnpj,
								razaoSocial: extracted.razaoSocial,
								nomeFantasia: extracted.nomeFantasia,
								municipio: extracted.municipio,
								uf: extracted.uf,
								payload: body as Prisma.InputJsonValue
							},
							tx
						);
					} catch (e) {
						if (!(e instanceof Prisma.PrismaClientKnownRequestError) || e.code !== 'P2002') {
							throw e;
						}
					}
				}
			}

			return novoCliente;
		});
		return mapClienteToResponse(created);
	} catch (e) {
		if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
			throw new HttpError(409, 'Já existe cliente com este CNPJ neste tenant');
		}
		throw e;
	}
}
