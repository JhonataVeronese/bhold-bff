import { Router } from 'express';
import { authRouter } from '../../../bhold/routes/auth.routes';
import { publicRouter } from '../../../bhold/routes/public.routes';
import { clienteRouter } from '../../../bhold/routes/cliente.routes';
import { contaBancariaRouter } from '../../../bhold/routes/conta-bancaria.routes';
import { formaPagamentoRouter } from '../../../bhold/routes/forma-pagamento.routes';
import { fornecedorRouter } from '../../../bhold/routes/fornecedor.routes';
import { financeiroExtratoRouter } from '../../../bhold/routes/financeiro-extrato.routes';
import { financeiroRouter } from '../../../bhold/routes/financeiro.routes';
import { tenantRouter } from '../../../bhold/routes/tenant.routes';
import { usuarioRouter } from '../../../bhold/routes/usuario.routes';
import { authenticateJwtMiddleware } from '../middlewares/authenticateJwt';
import { requireAdminOrSuperMiddleware } from '../middlewares/requireAdminOrSuper';
import { requireSuperMiddleware } from '../middlewares/requireSuper';
import { requireTenantMiddleware } from '../middlewares/requireTenant';

const router = Router();

router.get('/', (_req, res) => {
	res.status(200).json({
		name: 'bholder-bff',
		environment: process.env.ENVIRONMENT ?? 'development'
	});
});

router.use('/auth', authRouter);

/**
 * Rotas públicas (sem login / sem JWT):
 * - GET /public/tenants — lista id+nome dos tenants para a tela de login
 * - POST /auth/login — obtém o JWT
 * Segurança: apenas `X-BHOLD-API-Token` (middleware global em app.ts). Não envie Authorization Bearer aqui.
 */
router.use('/public', publicRouter);

router.use(authenticateJwtMiddleware);

/** Cadastro global: apenas perfil SUPER (JWT). */
router.use('/tenants', requireSuperMiddleware, tenantRouter);
router.use('/usuarios', requireAdminOrSuperMiddleware, usuarioRouter);

router.use(requireTenantMiddleware);

router.use('/fornecedores', fornecedorRouter);
router.use('/contas-bancarias', contaBancariaRouter);
router.use('/formas-pagamento', formaPagamentoRouter);
router.use('/clientes', clienteRouter);
router.use('/financeiro', financeiroExtratoRouter);
router.use(financeiroRouter);

export { router };
