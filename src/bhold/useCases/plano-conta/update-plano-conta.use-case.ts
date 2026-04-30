import { HttpError } from '../../http/HttpError';
import { planoContaRepository } from '../../repositories/planoConta.repository';
import { parsePositiveInt } from '../../utils/strings';
import { mapPlanoContaToResponse } from './plano-conta.mapper';
import { parsePlanoContaPayload } from './plano-conta.parsers';

export async function updatePlanoContaUseCase(tenantId: number, idRaw: unknown, body: Record<string, unknown>) {
	const id = parsePositiveInt(idRaw);
	if (id === null) throw new HttpError(400, 'id inválido');

	const existingConta = await planoContaRepository.findContaByIdInTenant(tenantId, id);
	if (!existingConta) throw new HttpError(404, 'Plano de conta não encontrado');
	if (existingConta.systemDefault) {
		throw new HttpError(409, 'Este plano de conta foi inserido via seed e não pode ser alterado');
	}

	const parsed = parsePlanoContaPayload(body);
	const grupo = await planoContaRepository.findGrupoByIdInTenant(tenantId, parsed.grupoId);
	if (!grupo) throw new HttpError(400, 'grupoId não encontrado neste tenant');

	const updated = await planoContaRepository.updateConta(tenantId, id, parsed);
	if (!updated) throw new HttpError(404, 'Plano de conta não encontrado');

	return mapPlanoContaToResponse(updated);
}
