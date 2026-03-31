-- AlterTable
ALTER TABLE "LancamentoFinanceiro" ADD COLUMN "recorrenciaGrupoId" UUID,
ADD COLUMN "recorrenciaParcela" INTEGER;

-- CreateIndex
CREATE INDEX "LancamentoFinanceiro_recorrenciaGrupoId_idx" ON "LancamentoFinanceiro"("recorrenciaGrupoId");
