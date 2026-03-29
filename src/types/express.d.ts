import type { Tenant } from '@prisma/client';
import type { AccessTokenPayload } from 'bhold/auth/jwt';

declare global {
	namespace Express {
		interface Request {
			/** Payload do JWT após `authenticateJwtMiddleware`. */
			auth?: AccessTokenPayload;
			/** Definido por `requireTenantMiddleware` (header `X-Tenant-Id`). */
			tenantId?: number;
			tenant?: Tenant;
		}
	}
}

export {};
