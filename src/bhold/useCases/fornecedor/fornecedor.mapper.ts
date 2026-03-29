import type { Fornecedor } from '@prisma/client';

export function mapFornecedorToResponse(f: Fornecedor) {
	return {
		id: String(f.id),
		cnpj: f.cnpj,
		razao_social: f.razaoSocial,
		nome_fantasia: f.nomeFantasia,
		municipio: f.municipio,
		uf: f.uf,
		cadastradoEm: f.createdAt.toISOString()
	};
}
