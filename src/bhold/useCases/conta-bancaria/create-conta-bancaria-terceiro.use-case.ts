import { HttpError } from '../../http/HttpError';
import { clienteRepository } from '../../repositories/cliente.repository';
import { contaBancariaTerceiroRepository } from '../../repositories/contaBancariaTerceiro.repository';
import { fornecedorRepository } from '../../repositories/fornecedor.repository';
import { parsePositiveInt, str } from '../../utils/strings';
import { mapContaBancariaTerceiroRow, parseTipoConta } from './conta-bancaria.mapper';

export async function createContaBancariaTerceiroUseCase(tenantId: number, body: Record<string, unknown>) {
	const fornecedorIdRaw = body.fornecedorId;
	const clienteIdRaw = body.clienteId;
	const hasFornecedor =
		fornecedorIdRaw !== undefined && fornecedorIdRaw !== null && String(fornecedorIdRaw).trim() !== '';
	const hasCliente = clienteIdRaw !== undefined && clienteIdRaw !== null && String(clienteIdRaw).trim() !== '';

	if (hasFornecedor === hasCliente) {
		throw new HttpError(400, 'Informe exatamente um dos campos: fornecedorId ou clienteId');
	}

	let fornecedorId: number | null = null;
	let clienteId: number | null = null;

	if (hasFornecedor) {
		const id = parsePositiveInt(fornecedorIdRaw);
		if (id === null) {
			throw new HttpError(400, 'fornecedorId inválido');
		}
		const f = await fornecedorRepository.findByIdInTenant(tenantId, id);
		if (!f) {
			throw new HttpError(400, 'fornecedorId não encontrado neste tenant');
		}
		fornecedorId = f.id;
	} else {
		const id = parsePositiveInt(clienteIdRaw);
		if (id === null) {
			throw new HttpError(400, 'clienteId inválido');
		}
		const c = await clienteRepository.findByIdInTenant(tenantId, id);
		if (!c) {
			throw new HttpError(400, 'clienteId não encontrado neste tenant');
		}
		clienteId = c.id;
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

	const created = await contaBancariaTerceiroRepository.create(tenantId, {
		fornecedorId,
		clienteId,
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

	return mapContaBancariaTerceiroRow(created);
}
