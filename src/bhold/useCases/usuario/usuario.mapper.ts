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

/** Resposta pós-login: dados do usuário + perfil de acesso (JSON e código enum). */
export function mapUsuarioAuthResponse(u: UsuarioComTenant) {
	const perfilAcesso = perfilToJson(u.perfil);
	return {
		id: String(u.id),
		tenantId: String(u.tenantId),
		tenantNome: u.tenant.nome,
		nome: u.nome,
		email: u.email,
		/** Perfil de acesso (valores estáveis para UI: super, admin, operador, leitura). */
		perfilAcesso,
		/** Alias legado de `perfilAcesso`. */
		perfil: perfilAcesso,
		/** Código do enum no banco / JWT (SUPER, ADMIN, OPERADOR, LEITURA). */
		perfilCodigo: u.perfil,
		ativo: u.ativo
	};
}
