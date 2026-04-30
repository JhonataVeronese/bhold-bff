import { GrupoPlanoConta, PlanoConta } from '@prisma/client';

type GrupoComPai = GrupoPlanoConta & { parent: GrupoPlanoConta | null };
type ContaComGrupo = PlanoConta & { grupo: GrupoPlanoConta };

export function mapGrupoPlanoContaToResponse(row: GrupoComPai) {
	return {
		id: String(row.id),
		codigo: row.codigo,
		descricao: row.descricao,
		nivel: row.nivel,
		parentId: row.parentId != null ? String(row.parentId) : null,
		parentCodigo: row.parent?.codigo ?? null,
		parentDescricao: row.parent?.descricao ?? null,
		systemDefault: row.systemDefault,
		criadoEm: row.createdAt.toISOString(),
		atualizadoEm: row.updatedAt.toISOString()
	};
}

export function mapPlanoContaToResponse(row: ContaComGrupo) {
	return {
		id: String(row.id),
		descricao: row.descricao,
		natureza: row.natureza === 'DEBITO' ? 'debito' : 'credito',
		ativo: row.ativo,
		systemDefault: row.systemDefault,
		grupo: {
			id: String(row.grupo.id),
			codigo: row.grupo.codigo,
			descricao: row.grupo.descricao,
			nivel: row.grupo.nivel
		},
		criadoEm: row.createdAt.toISOString(),
		atualizadoEm: row.updatedAt.toISOString()
	};
}
