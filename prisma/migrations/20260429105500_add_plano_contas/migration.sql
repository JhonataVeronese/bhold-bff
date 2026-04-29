CREATE TYPE "PlanoContaNatureza" AS ENUM ('DEBITO', 'CREDITO');

CREATE TABLE "GrupoPlanoConta" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "codigo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "nivel" INTEGER NOT NULL,
    "parentId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GrupoPlanoConta_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlanoConta" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "descricao" TEXT NOT NULL,
    "natureza" "PlanoContaNatureza" NOT NULL,
    "grupoId" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanoConta_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GrupoPlanoConta_tenantId_codigo_key" ON "GrupoPlanoConta"("tenantId", "codigo");
CREATE INDEX "GrupoPlanoConta_tenantId_idx" ON "GrupoPlanoConta"("tenantId");
CREATE INDEX "GrupoPlanoConta_parentId_idx" ON "GrupoPlanoConta"("parentId");
CREATE INDEX "GrupoPlanoConta_tenantId_nivel_idx" ON "GrupoPlanoConta"("tenantId", "nivel");

CREATE INDEX "PlanoConta_tenantId_idx" ON "PlanoConta"("tenantId");
CREATE INDEX "PlanoConta_grupoId_idx" ON "PlanoConta"("grupoId");
CREATE INDEX "PlanoConta_tenantId_natureza_idx" ON "PlanoConta"("tenantId", "natureza");

ALTER TABLE "GrupoPlanoConta"
ADD CONSTRAINT "GrupoPlanoConta_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GrupoPlanoConta"
ADD CONSTRAINT "GrupoPlanoConta_parentId_fkey"
FOREIGN KEY ("parentId") REFERENCES "GrupoPlanoConta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PlanoConta"
ADD CONSTRAINT "PlanoConta_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PlanoConta"
ADD CONSTRAINT "PlanoConta_grupoId_fkey"
FOREIGN KEY ("grupoId") REFERENCES "GrupoPlanoConta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
