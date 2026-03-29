import { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { HttpError } from '../../../bhold/http/HttpError';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
	if (err instanceof HttpError) {
		res.status(err.status).json({ error: err.message });
		return;
	}
	if (err instanceof Prisma.PrismaClientKnownRequestError) {
		if (err.code === 'P2002') {
			res.status(409).json({ error: 'Registro duplicado' });
			return;
		}
		if (err.code === 'P2003') {
			res.status(400).json({ error: 'Referência inválida (chave estrangeira)' });
			return;
		}
		if (err.code === 'P2025') {
			res.status(404).json({ error: 'Registro não encontrado' });
			return;
		}
	}
	console.error(err);
	res.status(500).json({ error: 'Erro interno do servidor' });
}
