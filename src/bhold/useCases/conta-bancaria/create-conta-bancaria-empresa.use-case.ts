import { Prisma } from '@prisma/client';
import { prisma } from '../../../infra/db/prisma/client';
import { HttpError } from '../../http/HttpError';
import { contaBancariaEmpresaRepository } from '../../repositories/contaBancariaEmpresa.repository';
import { movimentoContaEmpresaRepository } from '../../repositories/movimentoContaEmpresa.repository';
import { parseYmdToUtcDate } from '../../utils/dates';
import { str } from '../../utils/strings';
import { mapContaBancariaEmpresaRow, parseTipoConta } from './conta-bancaria.mapper';

export async function createContaBancariaEmpresaUseCase(tenantId: number, body: Record<string, unknown>) {
	const nome = str(body.nome);
	if (!nome) {
		throw new HttpError(400, 'nome é obrigatório');
	}
	const existingByNome = await contaBancariaEmpresaRepository.findFirstByNomeInTenant(tenantId, nome);
	if (existingByNome) {
		throw new HttpError(409, 'Já existe conta da empresa com este nome neste tenant');
	}

	const bankIspb = str(body.bankIspb);
	const bankFullName = str(body.bankFullName);
	const agencia = str(body.agencia);
	const conta = str(body.conta);
	if (!bankFullName || !agencia || !conta) {
		throw new HttpError(400, 'bankFullName, agencia e conta são obrigatórios');
	}

	const bankCodeRaw = body.bankCode;
	const bankCode = bankCodeRaw === null || bankCodeRaw === undefined || bankCodeRaw === '' ? null : Number(bankCodeRaw);
	if (bankCode !== null && Number.isNaN(bankCode)) {
		throw new HttpError(400, 'bankCode inválido');
	}

	const hasSaldoInicial =
		Object.prototype.hasOwnProperty.call(body, 'saldoInicial') ||
		Object.prototype.hasOwnProperty.call(body, 'dataSaldoInicial');
	const saldoInicialRaw = body.saldoInicial;
	const dataSaldoInicialRaw = body.dataSaldoInicial;
	let saldoInicial: Prisma.Decimal | null = null;
	let dataSaldoInicial: Date | null = null;
	if (hasSaldoInicial) {
		if (saldoInicialRaw === undefined || saldoInicialRaw === null || String(saldoInicialRaw).trim() === '') {
			throw new HttpError(400, 'saldoInicial é obrigatório quando dataSaldoInicial for informada');
		}
		if (
			dataSaldoInicialRaw === undefined ||
			dataSaldoInicialRaw === null ||
			String(dataSaldoInicialRaw).trim() === ''
		) {
			throw new HttpError(400, 'dataSaldoInicial é obrigatória quando saldoInicial for informado');
		}
		const saldoNumber = Number(saldoInicialRaw);
		if (!Number.isFinite(saldoNumber)) {
			throw new HttpError(400, 'saldoInicial inválido');
		}
		saldoInicial = new Prisma.Decimal(String(saldoNumber));
		dataSaldoInicial = parseYmdToUtcDate(dataSaldoInicialRaw);
	}

	const created = await prisma.$transaction(async (tx) => {
		const contaCriada = await contaBancariaEmpresaRepository.create(
			tenantId,
			{
				nome,
				bankIspb,
				bankCode,
				bankFullName,
				agencia,
				agenciaDigito: str(body.agenciaDigito) || null,
				conta,
				contaDigito: str(body.contaDigito) || null,
				tipoConta: parseTipoConta(body.tipoConta),
				pixChave: str(body.pixChave),
				dataSaldoInicial,
				saldoInicial
			},
			tx
		);

		if (saldoInicial !== null && dataSaldoInicial !== null) {
			await movimentoContaEmpresaRepository.create(
				tenantId,
				{
					contaBancariaEmpresaId: contaCriada.id,
					tipo: 'ABERTURA',
					valor: saldoInicial,
					dataMovimento: dataSaldoInicial,
					descricao: 'Saldo inicial da conta',
					observacao: ''
				},
				tx
			);
		}

		return contaCriada;
	});

	return mapContaBancariaEmpresaRow(created);
}
