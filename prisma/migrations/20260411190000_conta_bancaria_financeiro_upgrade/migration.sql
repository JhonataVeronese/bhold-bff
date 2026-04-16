CREATE TYPE "MovimentoContaTipo" AS ENUM ('ABERTURA', 'AJUSTE');

ALTER TABLE "ContaBancariaEmpresa"
ADD COLUMN "nome" TEXT NOT NULL DEFAULT '',
ADD COLUMN "dataSaldoInicial" DATE,
ADD COLUMN "saldoInicial" DECIMAL(18,2);

ALTER TABLE "FormaPagamento"
ADD COLUMN "contaBancariaEmpresaId" INTEGER;

ALTER TABLE "LancamentoFinanceiro"
ADD COLUMN "dataCompetencia" DATE NOT NULL DEFAULT CURRENT_DATE,
ADD COLUMN "numeroDocumento" TEXT NOT NULL DEFAULT '',
ADD COLUMN "contaGerencial" TEXT NOT NULL DEFAULT '',
ADD COLUMN "pixChave" TEXT NOT NULL DEFAULT '';

CREATE TABLE "MovimentoContaEmpresa" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "contaBancariaEmpresaId" INTEGER NOT NULL,
    "tipo" "MovimentoContaTipo" NOT NULL,
    "valor" DECIMAL(18,2) NOT NULL,
    "dataMovimento" DATE NOT NULL,
    "descricao" TEXT NOT NULL DEFAULT '',
    "observacao" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MovimentoContaEmpresa_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ContaBancariaEmpresa_tenantId_nome_idx" ON "ContaBancariaEmpresa"("tenantId", "nome");
CREATE INDEX "LancamentoFinanceiro_dataCompetencia_idx" ON "LancamentoFinanceiro"("dataCompetencia");
CREATE INDEX "MovimentoContaEmpresa_tenantId_idx" ON "MovimentoContaEmpresa"("tenantId");
CREATE INDEX "MovimentoContaEmpresa_contaBancariaEmpresaId_idx" ON "MovimentoContaEmpresa"("contaBancariaEmpresaId");
CREATE INDEX "MovimentoContaEmpresa_dataMovimento_idx" ON "MovimentoContaEmpresa"("dataMovimento");

ALTER TABLE "FormaPagamento"
ADD CONSTRAINT "FormaPagamento_contaBancariaEmpresaId_fkey"
FOREIGN KEY ("contaBancariaEmpresaId") REFERENCES "ContaBancariaEmpresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MovimentoContaEmpresa"
ADD CONSTRAINT "MovimentoContaEmpresa_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MovimentoContaEmpresa"
ADD CONSTRAINT "MovimentoContaEmpresa_contaBancariaEmpresaId_fkey"
FOREIGN KEY ("contaBancariaEmpresaId") REFERENCES "ContaBancariaEmpresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
