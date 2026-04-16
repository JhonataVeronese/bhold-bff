import { HttpError } from '../../http/HttpError';
import { str } from '../../utils/strings';
import { parseFormaPagamentoTipo, parsePrazoDias, parseTaxaPercentual } from './parse-forma-pagamento';

export function parseFormaPagamentoBody(body: Record<string, unknown>) {
	const nome = str(body.nome);
	if (!nome) {
		throw new HttpError(400, 'nome é obrigatório');
	}

	const tipo = parseFormaPagamentoTipo(body.tipo);
	const prazoDias = parsePrazoDias(body.prazoDias, tipo);
	const taxaPercentual = parseTaxaPercentual(body.taxaPercentual);
	const ativo = body.ativo === undefined ? true : Boolean(body.ativo);

	return {
		nome,
		tipo,
		prazoDias,
		taxaPercentual,
		ativo
	};
}
