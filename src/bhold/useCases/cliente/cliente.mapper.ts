import type { Cliente } from '@prisma/client';

export function mapClienteToResponse(c: Cliente) {
	return {
		id: String(c.id),
		cnpj: c.cnpj,
		razao_social: c.razaoSocial,
		nome_fantasia: c.nomeFantasia,
		municipio: c.municipio,
		uf: c.uf,
		cadastradoEm: c.createdAt.toISOString()
	};
}
