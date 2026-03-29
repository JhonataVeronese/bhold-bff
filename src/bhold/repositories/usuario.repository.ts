import { UsuarioPerfil } from '@prisma/client';
import { prisma } from '../../infra/db/prisma/client';

export const usuarioRepository = {
	findByTenantAndEmail(tenantId: number, email: string) {
		return prisma.usuario.findUnique({
			where: {
				tenantId_email: { tenantId, email: email.toLowerCase() }
			},
			include: { tenant: true }
		});
	},

	findSuperUserByEmail(email: string) {
		return prisma.usuario.findFirst({
			where: {
				email: email.toLowerCase(),
				perfil: 'SUPER',
				ativo: true
			},
			include: { tenant: true }
		});
	},

	/** Primeiro usuário com o e-mail (qualquer perfil) — só para mensagem de login. */
	findFirstByEmail(email: string) {
		return prisma.usuario.findFirst({
			where: { email: email.toLowerCase() }
		});
	},

	listAll() {
		return prisma.usuario.findMany({
			include: { tenant: true },
			orderBy: [{ tenantId: 'asc' }, { createdAt: 'desc' }]
		});
	},

	create(
		tenantId: number,
		data: {
			nome: string;
			email: string;
			senhaHash: string;
			perfil: UsuarioPerfil;
		}
	) {
		return prisma.usuario.create({
			data: {
				tenantId,
				nome: data.nome,
				email: data.email,
				senhaHash: data.senhaHash,
				perfil: data.perfil
			},
			include: { tenant: true }
		});
	}
};
