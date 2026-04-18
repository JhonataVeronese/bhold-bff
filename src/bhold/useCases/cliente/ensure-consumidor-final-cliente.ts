import { Prisma } from '@prisma/client';
import { CONSUMIDOR_FINAL_CNPJ } from '../../constants/cliente';
import { prisma } from '../../../infra/db/prisma/client';

export async function ensureConsumidorFinalClienteForTenant(tenantId: number) {
	await prisma.cliente.createMany({
		data: [
			{
				tenantId,
				cnpj: CONSUMIDOR_FINAL_CNPJ,
				razaoSocial: 'Consumidor final',
				nomeFantasia: 'Consumidor final',
				municipio: 'Não informado',
				uf: 'SP',
				payload: Prisma.JsonNull
			}
		],
		skipDuplicates: true
	});
}
