import { prisma } from '../db/prisma/client';
import { app } from './app';

const port = process.env.PORT ?? '3333';

const server = app.listen(Number(port), () => {
	console.log(`bholder-bff listening on port ${port}`);
});

const gracefulShutdown = async (signal: string) => {
	console.log(`\n${signal} received. Shutting down...`);
	server.close(async () => {
		try {
			await prisma.$disconnect();
			process.exit(0);
		} catch (error) {
			console.error(error);
			process.exit(1);
		}
	});
	setTimeout(() => process.exit(1), 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
	console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
	console.error('Uncaught Exception:', error);
	gracefulShutdown('UNCAUGHT_EXCEPTION');
});
