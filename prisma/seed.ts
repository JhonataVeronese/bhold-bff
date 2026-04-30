import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import { prisma } from '../src/infra/db/prisma/client';
import { ensureCarteiraContaForTenant } from '../src/bhold/useCases/conta-bancaria/ensure-carteira-default';
import { ensureConsumidorFinalClienteForTenant } from '../src/bhold/useCases/cliente/ensure-consumidor-final-cliente';
import { ensureDefaultFormasPagamentoForTenant } from '../src/bhold/useCases/forma-pagamento/default-formas-pagamento';

/** Credenciais de teste (super usuário). Altere em produção. */
const SUPER_EMAIL = 'super@bhold.local';
const SUPER_PASSWORD = 'Super123!';

type PlanoContasPayload = {
	grupos: Array<{
		codigo: string;
		descricao: string;
		nivel: number;
		codigoPai: string | null;
	}>;
	contas: Array<{
		descricao: string;
		natureza: 'DEBITO' | 'CREDITO';
		grupoCodigo: string;
	}>;
};

const planoContasJsonPath = path.resolve(__dirname, 'data', 'plano-contas.json');

function loadPlanoContasPayload(): PlanoContasPayload {
	const raw = fs.readFileSync(planoContasJsonPath, 'utf8');
	return JSON.parse(raw) as PlanoContasPayload;
}

async function seedPlanoContasForTenant(tenantId: number, payload: PlanoContasPayload) {
	await prisma.planoConta.deleteMany({ where: { tenantId } });
	await prisma.grupoPlanoConta.deleteMany({ where: { tenantId } });

	const gruposByCodigo = new Map<string, { id: number; codigoPai: string | null }>();
	const orderedGroups = [...payload.grupos].sort((a, b) => a.nivel - b.nivel);

	for (const item of orderedGroups) {
		const parentId = item.codigoPai ? gruposByCodigo.get(item.codigoPai)?.id ?? null : null;
		const grupo = await prisma.grupoPlanoConta.create({
			data: {
				tenantId,
				codigo: item.codigo,
				descricao: item.descricao,
				nivel: item.nivel,
				parentId,
				systemDefault: true
			}
		});
		gruposByCodigo.set(item.codigo, { id: grupo.id, codigoPai: item.codigoPai });
	}

	await prisma.planoConta.createMany({
		data: payload.contas
			.map((item) => {
				const grupoId = gruposByCodigo.get(item.grupoCodigo)?.id;
				if (!grupoId) return null;
				return {
					tenantId,
					descricao: item.descricao,
					natureza: item.natureza,
					grupoId,
					ativo: true,
					systemDefault: true
				};
			})
			.filter((item): item is NonNullable<typeof item> => Boolean(item))
	});
}

async function main() {
	const planoContasPayload = loadPlanoContasPayload();

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

	const tenants = await prisma.tenant.findMany({
		select: { id: true }
	});
	for (const item of tenants) {
		await ensureDefaultFormasPagamentoForTenant(item.id);
		await ensureCarteiraContaForTenant(item.id);
		await ensureConsumidorFinalClienteForTenant(item.id);
		await seedPlanoContasForTenant(item.id, planoContasPayload);
	}

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
