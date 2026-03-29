import { tenantRepository } from '../../repositories/tenant.repository';

const DEFAULT_MAX = 200;
const ABSOLUTE_MAX = 500;

function resolveTake(): number {
	const raw = process.env.PUBLIC_TENANTS_MAX;
	if (!raw) return DEFAULT_MAX;
	const n = parseInt(raw, 10);
	if (!Number.isFinite(n) || n < 1) return DEFAULT_MAX;
	return Math.min(n, ABSOLUTE_MAX);
}

/**
 * Lista mínima para tela de login (sem autenticação).
 * Retorna só id e nome; ids como string para alinhar ao restante da API.
 */
export async function listTenantsPublicLoginUseCase() {
	const rows = await tenantRepository.listMinimalForPublicLogin({ take: resolveTake() });
	return {
		data: rows.map((r) => ({
			id: String(r.id),
			nome: r.nome
		}))
	};
}
