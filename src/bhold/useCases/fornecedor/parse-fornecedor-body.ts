import { HttpError } from '../../http/HttpError';
import { normalizeCnpj } from '../../utils/cnpj';

type Jsonish = Record<string, unknown>;

function asRecord(v: unknown): Jsonish | undefined {
	if (v && typeof v === 'object' && !Array.isArray(v)) return v as Jsonish;
	return undefined;
}

function str(v: unknown): string {
	if (typeof v === 'string') return v.trim();
	if (typeof v === 'number') return String(v);
	return '';
}

export { normalizeCnpj };

export function extractFornecedorCampos(body: Jsonish): {
	cnpj: string;
	razaoSocial: string;
	nomeFantasia: string;
	municipio: string;
	uf: string;
} {
	const cnpj = normalizeCnpj(body.cnpj ?? body.cnpj_raiz);
	let razaoSocial = str(body.razao_social ?? body.razaoSocial);
	let nomeFantasia = str(body.nome_fantasia ?? body.nomeFantasia);
	let municipio = str(body.municipio);
	let uf = str(body.uf).toUpperCase().slice(0, 2);

	const est = asRecord(body.estabelecimento);
	if (est) {
		if (!razaoSocial) razaoSocial = str(est.razao_social ?? est.razaoSocial);
		if (!nomeFantasia) nomeFantasia = str(est.nome_fantasia ?? est.nomeFantasia);
		if (!municipio) municipio = str(est.municipio);
		if (!uf) uf = str(est.uf).toUpperCase().slice(0, 2);
		const cidade = asRecord(est.cidade);
		if (cidade && !municipio) municipio = str(cidade.nome);
		const estado = asRecord(est.estado);
		if (estado && !uf)
			uf = str(estado.sigla ?? estado.uf)
				.toUpperCase()
				.slice(0, 2);
	}

	return {
		cnpj,
		razaoSocial,
		nomeFantasia,
		municipio,
		uf
	};
}

export function validateFornecedorCreate(extracted: ReturnType<typeof extractFornecedorCampos>): void {
	if (extracted.cnpj.length !== 14) {
		throw new HttpError(400, 'CNPJ deve conter 14 dígitos');
	}
	if (!extracted.razaoSocial) {
		throw new HttpError(400, 'razao_social é obrigatório');
	}
	if (!extracted.nomeFantasia) {
		throw new HttpError(400, 'nome_fantasia é obrigatório');
	}
	if (!extracted.municipio) {
		throw new HttpError(400, 'municipio é obrigatório');
	}
	if (!extracted.uf || extracted.uf.length !== 2) {
		throw new HttpError(400, 'uf é obrigatório (sigla com 2 letras)');
	}
}
