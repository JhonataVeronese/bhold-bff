import { HttpError } from '../../http/HttpError';
import { planoContaRepository } from '../../repositories/planoConta.repository';
import { parsePositiveInt } from '../../utils/strings';
import { mapGrupoPlanoContaToResponse } from './plano-conta.mapper';
import { parseGrupoPayload } from './plano-conta.parsers';

export async function updateGrupoPlanoContaUseCase(
	tenantId: number,
	idRaw: unknown,
	body: Record<string, unknown>
) {
	const id = parsePositiveInt(idRaw);
	if (id === null) throw new HttpError(400, 'id inválido');

	const existingGrupo = await planoContaRepository.findGrupoByIdInTenant(tenantId, id);
	if (!existingGrupo) throw new HttpError(404, 'Grupo de plano de contas não encontrado');
	if (existingGrupo.systemDefault) {
		throw new HttpError(409, 'Este grupo foi inserido via seed e não pode ser alterado');
	}

	const parsed = parseGrupoPayload(body);
	const existingByCodigo = await planoContaRepository.findGrupoByCodigoInTenant(tenantId, parsed.codigo, id);
	if (existingByCodigo) throw new HttpError(409, 'Já existe grupo com este código neste tenant');

	let parentId: number | null = null;
	if (parsed.parentId !== null) {
		if (parsed.parentId === id) {
			throw new HttpError(400, 'Um grupo não pode ser pai de si mesmo');
		}
		const parent = await planoContaRepository.findGrupoByIdInTenant(tenantId, parsed.parentId);
		if (!parent) throw new HttpError(400, 'parentId não encontrado neste tenant');
		if (parent.nivel >= parsed.nivel) {
			throw new HttpError(400, 'O grupo pai deve ter nível menor que o grupo filho');
		}
		parentId = parent.id;
	}

	const updated = await planoContaRepository.updateGrupo(tenantId, id, {
		codigo: parsed.codigo,
		descricao: parsed.descricao,
		nivel: parsed.nivel,
		parentId
	});
	if (!updated) throw new HttpError(404, 'Grupo de plano de contas não encontrado');

	return mapGrupoPlanoContaToResponse(updated);
}
