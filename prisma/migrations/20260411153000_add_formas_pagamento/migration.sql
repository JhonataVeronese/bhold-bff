CREATE TYPE "FormaPagamentoTipo" AS ENUM (
    'DINHEIRO',
    'PIX',
    'TRANSFERENCIA',
    'CARTAO_CREDITO',
    'CARTAO_DEBITO',
    'OUTROS'
);

CREATE TABLE "FormaPagamento" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "FormaPagamentoTipo" NOT NULL,
    "prazoDias" INTEGER,
    "taxaPercentual" DECIMAL(5,2),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "padrao" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormaPagamento_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "LancamentoFinanceiro"
ADD COLUMN "formaPagamentoId" INTEGER,
ADD COLUMN "contaBancariaDestinoId" INTEGER;

CREATE UNIQUE INDEX "FormaPagamento_tenantId_nome_key" ON "FormaPagamento"("tenantId", "nome");
CREATE INDEX "FormaPagamento_tenantId_idx" ON "FormaPagamento"("tenantId");
CREATE INDEX "FormaPagamento_tenantId_tipo_idx" ON "FormaPagamento"("tenantId", "tipo");
CREATE INDEX "LancamentoFinanceiro_formaPagamentoId_idx" ON "LancamentoFinanceiro"("formaPagamentoId");
CREATE INDEX "LancamentoFinanceiro_contaBancariaDestinoId_idx" ON "LancamentoFinanceiro"("contaBancariaDestinoId");

ALTER TABLE "FormaPagamento"
ADD CONSTRAINT "FormaPagamento_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LancamentoFinanceiro"
ADD CONSTRAINT "LancamentoFinanceiro_formaPagamentoId_fkey"
FOREIGN KEY ("formaPagamentoId") REFERENCES "FormaPagamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "LancamentoFinanceiro"
ADD CONSTRAINT "LancamentoFinanceiro_contaBancariaDestinoId_fkey"
FOREIGN KEY ("contaBancariaDestinoId") REFERENCES "ContaBancariaEmpresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
