import { HttpError } from '../../http/HttpError';
import { contaBancariaEmpresaRepository } from '../../repositories/contaBancariaEmpresa.repository';
import { str } from '../../utils/strings';
import { mapContaBancariaEmpresaRow, parseTipoConta } from './conta-bancaria.mapper';

export async function createContaBancariaEmpresaUseCase(tenantId: number, body: Record<string, unknown>) {
	const bankIspb = str(body.bankIspb);
	const bankFullName = str(body.bankFullName);
	const agencia = str(body.agencia);
	const conta = str(body.conta);
	if (!bankIspb || !bankFullName || !agencia || !conta) {
		throw new HttpError(400, 'bankIspb, bankFullName, agencia e conta são obrigatórios');
	}

	const bankCodeRaw = body.bankCode;
	const bankCode = bankCodeRaw === null || bankCodeRaw === undefined || bankCodeRaw === '' ? null : Number(bankCodeRaw);
	if (bankCode !== null && Number.isNaN(bankCode)) {
		throw new HttpError(400, 'bankCode inválido');
	}

	const created = await contaBancariaEmpresaRepository.create(tenantId, {
		bankIspb,
		bankCode,
		bankFullName,
		agencia,
		agenciaDigito: str(body.agenciaDigito) || null,
		conta,
		contaDigito: str(body.contaDigito) || null,
		tipoConta: parseTipoConta(body.tipoConta),
		pixChave: str(body.pixChave)
	});

	return mapContaBancariaEmpresaRow(created);
}
