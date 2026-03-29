import { HttpError } from '../../http/HttpError';
import { contaBancariaRepository } from '../../repositories/contaBancaria.repository';
import { fornecedorRepository } from '../../repositories/fornecedor.repository';
import { parsePositiveInt, str } from '../../utils/strings';
import { mapContaBancariaCreated, parseTipoConta } from './conta-bancaria.mapper';

export async function createContaBancariaUseCase(tenantId: number, body: Record<string, unknown>) {
	const fornecedorId = parsePositiveInt(body.fornecedorId);
	if (fornecedorId === null) {
		throw new HttpError(400, 'fornecedorId é obrigatório e deve ser numérico');
	}
	const fornecedor = await fornecedorRepository.findByIdInTenant(tenantId, fornecedorId);
	if (!fornecedor) {
		throw new HttpError(400, 'fornecedorId não encontrado neste tenant');
	}

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

	const created = await contaBancariaRepository.create(tenantId, {
		fornecedorId,
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

	return mapContaBancariaCreated(created);
}
