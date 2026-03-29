import bcrypt from 'bcrypt';
import { prisma } from '../src/infra/db/prisma/client';

/** Credenciais de teste (super usuário). Altere em produção. */
const SUPER_EMAIL = 'super@bhold.local';
const SUPER_PASSWORD = 'Super123!';

async function main() {
	const tenant = await prisma.tenant.upsert({
		where: { slug: 'system' },
		create: {
			nome: 'Sistema BHold',
			slug: 'system',
			nomeFantasia: 'Sistema',
			cnpj: null
		},
		update: {}
	});

	const senhaHash = await bcrypt.hash(SUPER_PASSWORD, 10);

	await prisma.usuario.upsert({
		where: {
			tenantId_email: { tenantId: tenant.id, email: SUPER_EMAIL }
		},
		create: {
			tenantId: tenant.id,
			nome: 'Super usuário',
			email: SUPER_EMAIL,
			senhaHash,
			perfil: 'SUPER',
			ativo: true
		},
		update: {
			senhaHash,
			perfil: 'SUPER',
			ativo: true
		}
	});

	console.log(`Seed: tenant "system" (id=${tenant.id}), super usuário ${SUPER_EMAIL} / ${SUPER_PASSWORD}`);
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
