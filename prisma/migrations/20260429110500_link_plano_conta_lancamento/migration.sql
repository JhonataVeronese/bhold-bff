ALTER TABLE "LancamentoFinanceiro"
ADD COLUMN "planoContaId" INTEGER;

CREATE INDEX "LancamentoFinanceiro_planoContaId_idx" ON "LancamentoFinanceiro"("planoContaId");

ALTER TABLE "LancamentoFinanceiro"
ADD CONSTRAINT "LancamentoFinanceiro_planoContaId_fkey"
FOREIGN KEY ("planoContaId") REFERENCES "PlanoConta"("id") ON DELETE SET NULL ON UPDATE CASCADE;
