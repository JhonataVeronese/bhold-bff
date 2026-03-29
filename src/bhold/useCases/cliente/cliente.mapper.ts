import type { Cliente } from '@prisma/client';

export function mapClienteListItem(c: Cliente) {
	return {
		id: String(c.id),
		nome: c.nome,
		documento: c.documento,
		cadastradoEm: c.createdAt.toISOString()
	};
}

export function mapClienteCreated(c: Cliente) {
	return {
		id: String(c.id),
		nome: c.nome,
		documento: c.documento,
		cadastradoEm: c.createdAt.toISOString()
	};
}
