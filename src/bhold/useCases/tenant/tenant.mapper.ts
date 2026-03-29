import type { Tenant } from '@prisma/client';

/** Contrato `TenantListItem` / resposta única (front bhold-web). */
export function mapTenantToResponse(t: Tenant) {
	return {
		id: String(t.id),
		nome: t.nome,
		slug: t.slug,
		nomeFantasia: t.nomeFantasia,
		cadastradoEm: t.createdAt.toISOString()
	};
}
