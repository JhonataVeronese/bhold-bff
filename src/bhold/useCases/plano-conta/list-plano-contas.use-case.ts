import { PlanoContaNatureza } from '@prisma/client';
import { HttpError } from '../../http/HttpError';
import { planoContaRepository } from '../../repositories/planoConta.repository';
import { parsePositiveInt, str } from '../../utils/strings';
import { mapPlanoContaToResponse } from './plano-conta.mapper';

function parseQueryNatureza(v: unknown): PlanoContaNatureza | undefined {
	const raw = str(v).toLowerCase();
	if (!raw) return undefined;
	if (raw === 'debito') return 'DEBITO';
	if (raw === 'credito') return 'CREDITO';
	throw new HttpError(400, 'natureza deve ser debito ou credito');
}

function parseQueryAtivo(v: unknown): boolean | undefined {
	if (v === undefined || v === null || String(v).trim() === '') return undefined;
	const raw = String(v).trim().toLowerCase();
	if (raw === 'true' || raw === '1') return true;
	if (raw === 'false' || raw === '0') return false;
	throw new HttpError(400, 'ativo deve ser true/false');
}

export async function listPlanoContasUseCase(tenantId: number, query: Record<string, unknown>) {
	const natureza = parseQueryNatureza(query.natureza);
	const ativo = parseQueryAtivo(query.ativo);
	const grupoIdRaw = query.grupoId;
	const grupoId =
		grupoIdRaw === undefined || grupoIdRaw === null || String(grupoIdRaw).trim() === ''
			? undefined
			: parsePositiveInt(grupoIdRaw);

	if (
		grupoIdRaw !== undefined &&
		grupoIdRaw !== null &&
		String(grupoIdRaw).trim() !== '' &&
		grupoId === null
	) {
		throw new HttpError(400, 'grupoId inválido');
	}

	const rows = await planoContaRepository.listContasByTenant(tenantId, {
		natureza,
		grupoId: grupoId ?? undefined,
		ativo
	});
	return { data: rows.map(mapPlanoContaToResponse) };
}
