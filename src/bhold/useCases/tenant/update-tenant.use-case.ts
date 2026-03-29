import { HttpError } from '../../http/HttpError';
import { tenantRepository } from '../../repositories/tenant.repository';
import { normalizeCnpj } from '../../utils/cnpj';
import { normalizeSlug, parsePositiveInt, str } from '../../utils/strings';
import { mapTenantToResponse } from './tenant.mapper';

export async function updateTenantUseCase(idRaw: unknown, body: Record<string, unknown>) {
	const id = parsePositiveInt(idRaw);
	if (id === null) {
		throw new HttpError(400, 'id inválido');
	}
	const current = await tenantRepository.findById(id);
	if (!current) {
		throw new HttpError(404, 'Tenant não encontrado');
	}

	const hasNome = Object.prototype.hasOwnProperty.call(body, 'nome');
	const hasCnpj =
		Object.prototype.hasOwnProperty.call(body, 'documento') || Object.prototype.hasOwnProperty.call(body, 'cnpj');
	const hasSlug = Object.prototype.hasOwnProperty.call(body, 'slug');
	const hasNomeFantasia = Object.prototype.hasOwnProperty.call(body, 'nomeFantasia');

	if (!hasNome && !hasCnpj && !hasSlug && !hasNomeFantasia) {
		throw new HttpError(400, 'Informe ao menos um campo: nome, nomeFantasia, slug ou documento/cnpj');
	}

	const payload: { nome?: string; cnpj?: string | null; slug?: string; nomeFantasia?: string } = {};

	if (hasNome) {
		const nome = str(body.nome);
		if (!nome) {
			throw new HttpError(400, 'nome não pode ser vazio');
		}
		payload.nome = nome;
	}

	if (hasNomeFantasia) {
		const nomeFantasia = str(body.nomeFantasia);
		if (!nomeFantasia) {
			throw new HttpError(400, 'nomeFantasia não pode ser vazio');
		}
		payload.nomeFantasia = nomeFantasia;
	}

	if (hasSlug) {
		const slug = normalizeSlug(body.slug);
		if (!slug || slug.length < 2) {
			throw new HttpError(400, 'slug inválido');
		}
		if (slug !== current.slug) {
			const taken = await tenantRepository.findBySlug(slug);
			if (taken) {
				throw new HttpError(409, 'Já existe outro tenant com este slug');
			}
		}
		payload.slug = slug;
	}

	if (hasCnpj) {
		const raw = Object.prototype.hasOwnProperty.call(body, 'documento') ? body.documento : body.cnpj;
		const cnpj = raw === undefined || raw === null || String(raw).trim() === '' ? null : normalizeCnpj(raw);
		if (cnpj !== null && cnpj.length !== 14) {
			throw new HttpError(400, 'CNPJ/documento deve ter 14 dígitos quando informado');
		}
		if (cnpj) {
			const conflict = await tenantRepository.findFirstByCnpjExcludingId(cnpj, id);
			if (conflict) {
				throw new HttpError(409, 'Já existe outro tenant com este CNPJ');
			}
		}
		payload.cnpj = cnpj;
	}

	const updated = await tenantRepository.update(id, payload);
	return mapTenantToResponse(updated);
}
