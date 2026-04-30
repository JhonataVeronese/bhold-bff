import { PlanoContaNatureza } from '@prisma/client';
import { HttpError } from '../../http/HttpError';
import { parsePositiveInt, str } from '../../utils/strings';

export function parsePlanoContaNatureza(v: unknown): PlanoContaNatureza {
	const raw = str(v).toLowerCase();
	if (raw === 'debito') return 'DEBITO';
	if (raw === 'credito') return 'CREDITO';
	throw new HttpError(400, 'natureza deve ser debito ou credito');
}

export function parseGrupoPayload(body: Record<string, unknown>) {
	const codigo = str(body.codigo);
	if (!codigo) throw new HttpError(400, 'codigo é obrigatório');

	const descricao = str(body.descricao);
	if (!descricao) throw new HttpError(400, 'descricao é obrigatório');

	const nivel = Number(body.nivel);
	if (!Number.isInteger(nivel) || nivel < 1) {
		throw new HttpError(400, 'nivel deve ser inteiro >= 1');
	}

	const parentIdRaw = body.parentId;
	let parentId: number | null = null;
	if (parentIdRaw !== undefined && parentIdRaw !== null && String(parentIdRaw).trim() !== '') {
		parentId = parsePositiveInt(parentIdRaw);
		if (parentId === null) throw new HttpError(400, 'parentId inválido');
	}

	return {
		codigo,
		descricao,
		nivel,
		parentId
	};
}

export function parsePlanoContaPayload(body: Record<string, unknown>) {
	const descricao = str(body.descricao);
	if (!descricao) throw new HttpError(400, 'descricao é obrigatório');

	const natureza = parsePlanoContaNatureza(body.natureza);

	const grupoId = parsePositiveInt(body.grupoId);
	if (grupoId === null) throw new HttpError(400, 'grupoId é obrigatório e deve ser numérico');

	let ativo = true;
	if (Object.prototype.hasOwnProperty.call(body, 'ativo')) {
		ativo = Boolean(body.ativo);
	}

	return {
		descricao,
		natureza,
		grupoId,
		ativo
	};
}
