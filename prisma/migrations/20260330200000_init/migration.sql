-- CreateSchema (init único: estrutura atual do bhold-bff)

-- CreateEnum
CREATE TYPE "UsuarioPerfil" AS ENUM ('SUPER', 'ADMIN', 'OPERADOR', 'LEITURA');

-- CreateEnum
CREATE TYPE "TipoContaBancaria" AS ENUM ('CORRENTE', 'POUPANCA', 'PAGAMENTO');

-- CreateEnum
CREATE TYPE "FinanceType" AS ENUM ('PAYABLE', 'RECEIVABLE');

-- CreateEnum
CREATE TYPE "RecurrenceType" AS ENUM ('UNICA', 'MENSAL', 'ANUAL');

-- CreateTable
CREATE TABLE "Tenant" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nomeFantasia" TEXT NOT NULL,
    "cnpj" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fornecedor" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "cnpj" TEXT NOT NULL,
    "razaoSocial" TEXT NOT NULL,
    "nomeFantasia" TEXT NOT NULL,
    "municipio" TEXT NOT NULL,
    "uf" VARCHAR(2) NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Fornecedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "cnpj" TEXT NOT NULL,
    "razaoSocial" TEXT NOT NULL,
    "nomeFantasia" TEXT NOT NULL,
    "municipio" TEXT NOT NULL,
    "uf" VARCHAR(2) NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContaBancariaEmpresa" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "bankIspb" TEXT NOT NULL,
    "bankCode" INTEGER,
    "bankFullName" TEXT NOT NULL,
    "agencia" TEXT NOT NULL,
    "agenciaDigito" TEXT,
    "conta" TEXT NOT NULL,
    "contaDigito" TEXT,
    "tipoConta" "TipoContaBancaria" NOT NULL,
    "pixChave" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContaBancariaEmpresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContaBancariaTerceiro" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "fornecedorId" INTEGER,
    "clienteId" INTEGER,
    "bankIspb" TEXT NOT NULL,
    "bankCode" INTEGER,
    "bankFullName" TEXT NOT NULL,
    "agencia" TEXT NOT NULL,
    "agenciaDigito" TEXT,
    "conta" TEXT NOT NULL,
    "contaDigito" TEXT,
    "tipoConta" "TipoContaBancaria" NOT NULL,
    "pixChave" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContaBancariaTerceiro_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ContaBancariaTerceiro_fornecedor_xor_cliente" CHECK (
        ("fornecedorId" IS NOT NULL AND "clienteId" IS NULL) OR
        ("fornecedorId" IS NULL AND "clienteId" IS NOT NULL)
    )
);

-- CreateTable
CREATE TABLE "LancamentoFinanceiro" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "type" "FinanceType" NOT NULL,
    "valor" DECIMAL(18,2) NOT NULL,
    "dataVencimento" DATE NOT NULL,
    "dataPagamento" DATE,
    "contaBancariaEmpresaId" INTEGER NOT NULL,
    "contaBancariaTerceiroId" INTEGER,
    "fornecedorId" INTEGER,
    "clienteId" INTEGER,
    "descricao" TEXT NOT NULL DEFAULT '',
    "recorrenciaAtiva" BOOLEAN NOT NULL DEFAULT false,
    "recorrenciaTipo" "RecurrenceType" NOT NULL,
    "recorrenciaQuantidade" INTEGER NOT NULL DEFAULT 1,
    "observacao" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LancamentoFinanceiro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "perfil" "UsuarioPerfil" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_cnpj_key" ON "Tenant"("cnpj");

-- CreateIndex
CREATE INDEX "Fornecedor_tenantId_idx" ON "Fornecedor"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Fornecedor_tenantId_cnpj_key" ON "Fornecedor"("tenantId", "cnpj");

-- CreateIndex
CREATE INDEX "Cliente_tenantId_idx" ON "Cliente"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_tenantId_cnpj_key" ON "Cliente"("tenantId", "cnpj");

-- CreateIndex
CREATE INDEX "ContaBancariaEmpresa_tenantId_idx" ON "ContaBancariaEmpresa"("tenantId");

-- CreateIndex
CREATE INDEX "ContaBancariaTerceiro_tenantId_idx" ON "ContaBancariaTerceiro"("tenantId");

-- CreateIndex
CREATE INDEX "ContaBancariaTerceiro_tenantId_fornecedorId_idx" ON "ContaBancariaTerceiro"("tenantId", "fornecedorId");

-- CreateIndex
CREATE INDEX "ContaBancariaTerceiro_tenantId_clienteId_idx" ON "ContaBancariaTerceiro"("tenantId", "clienteId");

-- CreateIndex
CREATE INDEX "LancamentoFinanceiro_tenantId_idx" ON "LancamentoFinanceiro"("tenantId");

-- CreateIndex
CREATE INDEX "LancamentoFinanceiro_tenantId_type_idx" ON "LancamentoFinanceiro"("tenantId", "type");

-- CreateIndex
CREATE INDEX "LancamentoFinanceiro_contaBancariaTerceiroId_idx" ON "LancamentoFinanceiro"("contaBancariaTerceiroId");

-- CreateIndex
CREATE INDEX "Usuario_tenantId_idx" ON "Usuario"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_tenantId_email_key" ON "Usuario"("tenantId", "email");

-- AddForeignKey
ALTER TABLE "Fornecedor" ADD CONSTRAINT "Fornecedor_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContaBancariaEmpresa" ADD CONSTRAINT "ContaBancariaEmpresa_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContaBancariaTerceiro" ADD CONSTRAINT "ContaBancariaTerceiro_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContaBancariaTerceiro" ADD CONSTRAINT "ContaBancariaTerceiro_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "Fornecedor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContaBancariaTerceiro" ADD CONSTRAINT "ContaBancariaTerceiro_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LancamentoFinanceiro" ADD CONSTRAINT "LancamentoFinanceiro_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LancamentoFinanceiro" ADD CONSTRAINT "LancamentoFinanceiro_contaBancariaEmpresaId_fkey" FOREIGN KEY ("contaBancariaEmpresaId") REFERENCES "ContaBancariaEmpresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LancamentoFinanceiro" ADD CONSTRAINT "LancamentoFinanceiro_contaBancariaTerceiroId_fkey" FOREIGN KEY ("contaBancariaTerceiroId") REFERENCES "ContaBancariaTerceiro"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LancamentoFinanceiro" ADD CONSTRAINT "LancamentoFinanceiro_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "Fornecedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LancamentoFinanceiro" ADD CONSTRAINT "LancamentoFinanceiro_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
