import { HttpError } from '../../http/HttpError';
import { tenantRepository } from '../../repositories/tenant.repository';
import { normalizeCnpj } from '../../utils/cnpj';
import { normalizeSlug, str } from '../../utils/strings';
import { ensureCarteiraContaForTenant } from '../conta-bancaria/ensure-carteira-default';
import { ensureDefaultFormasPagamentoForTenant } from '../forma-pagamento/default-formas-pagamento';
import { mapTenantToResponse } from './tenant.mapper';

export async function createTenantUseCase(body: Record<string, unknown>) {
	const nome = str(body?.nome);
	const nomeFantasia = str(body?.nomeFantasia);
	const slug = normalizeSlug(body?.slug);

	if (!nome) {
		throw new HttpError(400, 'nome é obrigatório');
	}
	if (!nomeFantasia) {
		throw new HttpError(400, 'nomeFantasia é obrigatório');
	}
	if (!slug || slug.length < 2) {
		throw new HttpError(400, 'slug é obrigatório (mínimo 2 caracteres, letras minúsculas, números e hífens)');
	}

	const documentoRaw = body?.documento;
	const cnpj =
		documentoRaw === undefined || documentoRaw === null || String(documentoRaw).trim() === ''
			? null
			: normalizeCnpj(documentoRaw);
	if (cnpj !== null && cnpj.length !== 14) {
		throw new HttpError(400, 'documento (CNPJ) deve ter 14 dígitos quando informado');
	}

	const slugTaken = await tenantRepository.findBySlug(slug);
	if (slugTaken) {
		throw new HttpError(409, 'Já existe um tenant com este slug');
	}
	if (cnpj) {
		const existing = await tenantRepository.findByCnpj(cnpj);
		if (existing) {
			throw new HttpError(409, 'Já existe um tenant com este CNPJ');
		}
	}

	const created = await tenantRepository.create({
		nome,
		slug,
		nomeFantasia,
		cnpj
	});
	await ensureDefaultFormasPagamentoForTenant(created.id);
	await ensureCarteiraContaForTenant(created.id);
	return mapTenantToResponse(created);
}
