import type { Tenant, Usuario } from '@prisma/client';
import { UsuarioPerfil } from '@prisma/client';

function perfilToJson(p: UsuarioPerfil): 'super' | 'admin' | 'operador' | 'leitura' {
	switch (p) {
		case 'SUPER':
			return 'super';
		case 'ADMIN':
			return 'admin';
		case 'OPERADOR':
			return 'operador';
		case 'LEITURA':
			return 'leitura';
		default:
			return 'leitura';
	}
}

type UsuarioComTenant = Usuario & { tenant: Tenant };

export function mapUsuarioListItem(u: UsuarioComTenant) {
	return {
		id: String(u.id),
		tenantId: String(u.tenantId),
		tenantNome: u.tenant.nome,
		nome: u.nome,
		email: u.email,
		perfil: perfilToJson(u.perfil),
		ativo: u.ativo,
		cadastradoEm: u.createdAt.toISOString()
	};
}

export function mapUsuarioCreated(u: UsuarioComTenant) {
	return {
		id: String(u.id),
		tenantId: String(u.tenantId),
		tenantNome: u.tenant.nome,
		nome: u.nome,
		email: u.email,
		perfil: perfilToJson(u.perfil),
		ativo: u.ativo,
		cadastradoEm: u.createdAt.toISOString()
	};
}

export function mapUsuarioAuthResponse(u: UsuarioComTenant) {
	return {
		id: String(u.id),
		tenantId: String(u.tenantId),
		tenantNome: u.tenant.nome,
		nome: u.nome,
		email: u.email,
		perfil: perfilToJson(u.perfil),
		ativo: u.ativo
	};
}
