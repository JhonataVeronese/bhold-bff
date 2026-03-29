import { prisma } from '@infra/db/prisma/client';
import fs from 'fs';

prisma.tipoProduto.findMany().then(async (tipoProdutos) => {
	const updatesProdutos = [];

	for (const tipoProduto of tipoProdutos) {
		let contadorPorTipoProduto = 0;

		const produtos = await prisma.produto.findMany({
			where: {
				idTipoProduto: tipoProduto.id
			},
			orderBy: {
				id: 'asc'
			}
		});

		for (const produto of produtos) {
			contadorPorTipoProduto += 1;

			const updateProduto = `UPDATE "Produto" SET "codigoProduto" = '${
				tipoProduto.sigla
			}${contadorPorTipoProduto.toString().padStart(4, '0')}' WHERE id = '${
				produto.id
			}';`;

			updatesProdutos.push(updateProduto);
		}
	}

	const sqlCommands = updatesProdutos.join('\n');

	fs.writeFile('setCodigoProduto.sql', sqlCommands, (err) => {
		if (err) throw err;
		console.log('Arquivo "setCodigoProduto.sql" criado com sucesso.');
	});
});
