import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { errorHandler } from './middlewares/errorHandler';
import { requireApiTokenMiddleware } from './middlewares/requireApiToken';
import { router } from './routes';

const app = express();

app.disable('x-powered-by');
app.use(
	cors({
		allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Id', 'X-BHOLD-API-Token']
	})
);
app.use(helmet());
app.use(express.json());
/**
 * Todas as rotas: valida `X-BHOLD-API-Token` = `BHOLD_API_TOKEN` (quando configurado).
 * O JWT só é exigido nas rotas registradas após `authenticateJwtMiddleware`.
 */
app.use(requireApiTokenMiddleware);
app.use(router);
app.use(errorHandler);

export { app };
