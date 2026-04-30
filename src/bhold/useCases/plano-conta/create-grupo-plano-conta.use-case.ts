import { HttpError } from '../../http/HttpError';
import { planoContaRepository } from '../../repositories/planoConta.repository';
import { mapGrupoPlanoContaToResponse } from './plano-conta.mapper';
import { parseGrupoPayload } from './plano-conta.parsers';

export async function createGrupoPlanoContaUseCase(tenantId: number, body: Record<string, unknown>) {
	const parsed = parseGrupoPayload(body);

	const existingByCodigo = await planoContaRepository.findGrupoByCodigoInTenant(tenantId, parsed.codigo);
	if (existingByCodigo) throw new HttpError(409, 'Já existe grupo com este código neste tenant');

	let parentId: number | null = null;
	if (parsed.parentId !== null) {
		const parent = await planoContaRepository.findGrupoByIdInTenant(tenantId, parsed.parentId);
		if (!parent) throw new HttpError(400, 'parentId não encontrado neste tenant');
		if (parent.nivel >= parsed.nivel) {
			throw new HttpError(400, 'O grupo pai deve ter nível menor que o grupo filho');
		}
		parentId = parent.id;
	}

	const created = await planoContaRepository.createGrupo(tenantId, {
		codigo: parsed.codigo,
		descricao: parsed.descricao,
		nivel: parsed.nivel,
		parentId
	});

	return mapGrupoPlanoContaToResponse(created);
}
