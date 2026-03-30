import { asyncHandler } from '../../infra/http/middlewares/asyncHandler';
import { getTenantId } from '../http/tenantContext';
import { createContaBancariaEmpresaUseCase } from '../useCases/conta-bancaria/create-conta-bancaria-empresa.use-case';
import { createContaBancariaTerceiroUseCase } from '../useCases/conta-bancaria/create-conta-bancaria-terceiro.use-case';
import { listContasBancariasEmpresaUseCase } from '../useCases/conta-bancaria/list-contas-bancarias-empresa.use-case';
import { deleteContaBancariaEmpresaUseCase } from '../useCases/conta-bancaria/delete-conta-bancaria-empresa.use-case';
import { deleteContaBancariaTerceiroUseCase } from '../useCases/conta-bancaria/delete-conta-bancaria-terceiro.use-case';
import { listContasBancariasTerceirosUseCase } from '../useCases/conta-bancaria/list-contas-bancarias-terceiros.use-case';

export const contaBancariaController = {
	/** Contas da própria empresa (caixa). */
	listEmpresa: asyncHandler(async (req, res) => {
		const tenantId = getTenantId(req);
		const result = await listContasBancariasEmpresaUseCase(tenantId);
		res.json(result);
	}),

	createEmpresa: asyncHandler(async (req, res) => {
		const tenantId = getTenantId(req);
		const result = await createContaBancariaEmpresaUseCase(tenantId, req.body as Record<string, unknown>);
		res.status(201).json(result);
	}),

	/** Contas de clientes ou fornecedores (dados bancários de terceiros). */
	listTerceiros: asyncHandler(async (req, res) => {
		const tenantId = getTenantId(req);
		const result = await listContasBancariasTerceirosUseCase(tenantId);
		res.json(result);
	}),

	createTerceiro: asyncHandler(async (req, res) => {
		const tenantId = getTenantId(req);
		const result = await createContaBancariaTerceiroUseCase(tenantId, req.body as Record<string, unknown>);
		res.status(201).json(result);
	}),

	deleteEmpresa: asyncHandler(async (req, res) => {
		const tenantId = getTenantId(req);
		await deleteContaBancariaEmpresaUseCase(tenantId, req.params.id);
		res.status(204).send();
	}),

	deleteTerceiro: asyncHandler(async (req, res) => {
		const tenantId = getTenantId(req);
		await deleteContaBancariaTerceiroUseCase(tenantId, req.params.id);
		res.status(204).send();
	})
};
