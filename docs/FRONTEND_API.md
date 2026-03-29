# Integração do front com o BFF BHold (`bholder-bff`)

Documentação das rotas HTTP disponíveis, autenticação e headers esperados. Base URL de exemplo: valor de `BHOLD_API_BASE_URL` (sem barra final).

---

## 1. Visão geral de segurança

| Camada | Onde | Header / corpo |
|--------|------|----------------|
| **Token da API** | Todas as rotas (quando `BHOLD_API_TOKEN` está definido no servidor) | `X-BHOLD-API-Token: <valor igual ao env do servidor>` |
| **JWT (usuário logado)** | Rotas após login (exceto as explicitamente públicas abaixo) | `Authorization: Bearer <accessToken>` |
| **Tenant (escopo)** | Rotas que operam dados de um tenant específico | `X-Tenant-Id: <id numérico>` |

- Em **desenvolvimento**, se `BHOLD_API_TOKEN` **não** estiver definido no `.env` da API, o header `X-BHOLD-API-Token` **não** é exigido.
- Em **produção** (`NODE_ENV=production`), `BHOLD_API_TOKEN` é **obrigatório** no servidor; sem ele a API responde **503**.

**CORS:** o browser pode enviar `Content-Type`, `Authorization`, `X-Tenant-Id` e `X-BHOLD-API-Token`.

---

## 2. Rotas sem JWT (antes do login ou só com token da API)

Essas rotas **não** exigem `Authorization: Bearer` (JWT). Continuam exigindo `X-BHOLD-API-Token` quando a API estiver configurada com `BHOLD_API_TOKEN`.

| Método | Caminho | Descrição |
|--------|---------|-----------|
| `GET` | `/` | Health: `{ name, environment }` |
| `GET` | `/public/tenants` | Lista mínima de tenants para seleção na tela de login (`id`, `nome`). Não inclui o tenant interno `slug: system`. |
| `POST` | `/auth/login` | Login; retorna JWT e dados do usuário. |

**Exemplo `GET /` (200):**

```json
{
  "name": "bholder-bff",
  "environment": "development"
}
```

### `POST /auth/login`

**Body (JSON):**

| Campo | Tipo | Obrigatório | Notas |
|-------|------|-------------|--------|
| `email` | string | sim | Normalizado em minúsculas no servidor |
| `senha` | string | sim | |
| `tenantId` | number | condicional | **Obrigatório** para usuários **admin / operador / leitura** (cadastrados em um tenant). **Não enviar** para usuário **SUPER** (ex.: seed). |

**Resposta 200:**

```json
{
  "accessToken": "<jwt>",
  "tokenType": "Bearer",
  "user": {
    "id": "1",
    "tenantId": "1",
    "tenantNome": "…",
    "nome": "…",
    "email": "…",
    "perfil": "super | admin | operador | leitura",
    "ativo": true
  }
}
```

**Erros comuns:** `400` (validação), `401` (credenciais), `403` (usuário inativo).

### `GET /public/tenants`

**Resposta 200:**

```json
{
  "data": [
    { "id": "1", "nome": "Razão social / nome" }
  ]
}
```

Limite padrão de itens: 200 (máx. 500), configurável na API com `PUBLIC_TENANTS_MAX`.

---

## 3. Rotas com JWT (usuário autenticado)

Todas exigem:

- `X-BHOLD-API-Token` (quando a API exige token da aplicação)
- `Authorization: Bearer <accessToken>`

### 3.1 Apenas perfil **SUPER** (cadastro global)

JWT com `perfil` = `SUPER` (claim no token emitido no login).

| Método | Caminho | Descrição |
|--------|---------|-----------|
| `GET` | `/tenants` | Lista tenants (`{ data: [...] }`) |
| `POST` | `/tenants` | Cria tenant |
| `GET` | `/tenants/:id` | Detalhe do tenant |
| `PATCH` | `/tenants/:id` | Atualiza tenant |
| `DELETE` | `/tenants/:id` | Remove tenant |
| `GET` | `/usuarios` | Lista **todos** os usuários (com dados do tenant) |
| `POST` | `/usuarios` | Cria usuário; **body** deve incluir `tenantId` do tenant alvo |

**POST /tenants** — campos principais (ver validação na API): `nome`, `slug`, `nomeFantasia`, `documento` (CNPJ opcional).

**POST /usuarios** — `tenantId`, `nome`, `email`, `senha`, `perfil` (`admin` \| `operador` \| `leitura`). Perfil `super` não é criado por esta rota.

**Exemplo `POST /tenants` (body):**

```json
{
  "nome": "Empresa XYZ Ltda",
  "slug": "empresa-xyz",
  "nomeFantasia": "XYZ",
  "documento": "12345678000199"
}
```

**Exemplo resposta `GET /tenants` ou item de lista (200):**

```json
{
  "data": [
    {
      "id": "2",
      "nome": "Empresa XYZ Ltda",
      "slug": "empresa-xyz",
      "nomeFantasia": "XYZ",
      "cadastradoEm": "2026-01-15T12:00:00.000Z"
    }
  ]
}
```

**Exemplo `POST /usuarios` (body):**

```json
{
  "tenantId": 2,
  "nome": "Maria Operadora",
  "email": "maria@empresa.com",
  "senha": "senhaSegura123",
  "perfil": "operador"
}
```

**Exemplo resposta `POST /usuarios` (201):**

```json
{
  "id": "10",
  "tenantId": "2",
  "tenantNome": "Empresa XYZ Ltda",
  "nome": "Maria Operadora",
  "email": "maria@empresa.com",
  "perfil": "operador",
  "ativo": true,
  "cadastradoEm": "2026-03-27T14:30:00.000Z"
}
```

---

### 3.2 Escopo por tenant (`X-Tenant-Id`)

Além do JWT, enviar:

`X-Tenant-Id: <id numérico do tenant>`

- Usuário **comum**: o header deve ser o **mesmo** `tenantId` do usuário no JWT.
- Usuário **SUPER**: pode enviar o `X-Tenant-Id` de **qualquer** tenant existente para operar nesse escopo.

| Método | Caminho | Descrição |
|--------|---------|-----------|
| `GET` | `/fornecedores` | Lista fornecedores (detalhe em **3.3**) |
| `POST` | `/fornecedores` | Cria fornecedor (**3.3**) |
| `GET` | `/contas-bancarias` | Lista contas bancárias (**3.4**) |
| `POST` | `/contas-bancarias` | Cria conta bancária (**3.4**) |
| `GET` | `/clientes` | Lista clientes |
| `POST` | `/clientes` | Cria cliente |
| `GET` | `/dashboard` | Dashboard financeiro (**3.5**) |
| `GET` | `/lancamentos-financeiros` | Lista lançamentos (**3.5**) |
| `POST` | `/lancamentos-financeiros` | Cria lançamento (**3.5**) |
| `GET` | `/contas-a-pagar` | Lista contas a pagar (= lançamentos `payable`) (**3.5**) |
| `POST` | `/contas-a-pagar` | Cria lançamento a pagar (**3.5**) |
| `GET` | `/contas-a-receber` | Lista contas a receber (= `receivable`) (**3.5**) |
| `POST` | `/contas-a-receber` | Cria lançamento a receber (**3.5**) |

**Nota:** nesta versão da API, **fornecedores**, **contas bancárias** e **lançamentos financeiros** expõem apenas **criação** e **listagem**. Não há rotas `GET /:id`, `PATCH /:id` nem `DELETE /:id` para esses recursos.

Ids numéricos costumam vir como **string** no JSON de resposta. O módulo financeiro usa `kind` / `type` com valores `payable` \| `receivable`.

#### Clientes (`GET` \| `POST /clientes`)

**Exemplo `POST /clientes` (body):**

```json
{
  "nome": "Cliente Fulano de Tal",
  "documento": "123.456.789-00"
}
```

(`documento` pode ser omitido ou `null`.)

**Exemplo `GET /clientes` (200):**

```json
{
  "data": [
    {
      "id": "5",
      "nome": "Cliente Fulano de Tal",
      "documento": "12345678900",
      "cadastradoEm": "2026-02-01T10:00:00.000Z"
    }
  ]
}
```

---

### 3.3 Fornecedores (`/fornecedores`)

Escopo: `X-Tenant-Id` + JWT.

| Método | Caminho | Resposta |
|--------|---------|----------|
| `GET` | `/fornecedores` | `200` — `{ "data": [ ... ] }` |
| `POST` | `/fornecedores` | `201` — um objeto fornecedor criado |

**Item em `data` (lista / espelho do create):**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | string | Id do fornecedor |
| `cnpj` | string | 14 dígitos (normalizado no servidor) |
| `razao_social` | string | |
| `nome_fantasia` | string | |
| `municipio` | string | |
| `uf` | string | Sigla UF (2 letras) |
| `cadastradoEm` | string | ISO 8601 (`createdAt`) |

**Body `POST` (JSON)** — campos aceitos (aliases entre parênteses):

| Campo | Obrigatório | Notas |
|-------|-------------|--------|
| `cnpj` ou `cnpj_raiz` | sim | 14 dígitos após normalização |
| `razao_social` ou `razaoSocial` | sim | |
| `nome_fantasia` ou `nomeFantasia` | sim | |
| `municipio` | sim | |
| `uf` | sim | 2 letras |

Também é aceito um objeto aninhado `estabelecimento` (como em integrações de CNPJ): `razao_social`, `nome_fantasia`, `municipio`, `uf`, ou `cidade.nome` / `estado.sigla` para preencher município e UF.

**Exemplo `POST /fornecedores` (body):**

```json
{
  "cnpj": "12345678000199",
  "razao_social": "Fornecedor ABC Ltda",
  "nome_fantasia": "ABC Peças",
  "municipio": "São Paulo",
  "uf": "SP"
}
```

**Exemplo `GET /fornecedores` (200):**

```json
{
  "data": [
    {
      "id": "3",
      "cnpj": "12345678000199",
      "razao_social": "Fornecedor ABC Ltda",
      "nome_fantasia": "ABC Peças",
      "municipio": "São Paulo",
      "uf": "SP",
      "cadastradoEm": "2026-03-01T08:00:00.000Z"
    }
  ]
}
```

**Exemplo `POST /fornecedores` (201)** — mesmo formato de um item de lista:

```json
{
  "id": "3",
  "cnpj": "12345678000199",
  "razao_social": "Fornecedor ABC Ltda",
  "nome_fantasia": "ABC Peças",
  "municipio": "São Paulo",
  "uf": "SP",
  "cadastradoEm": "2026-03-01T08:00:00.000Z"
}
```

---

### 3.4 Contas bancárias (`/contas-bancarias`)

Cada conta está vinculada a um **fornecedor** do tenant.

| Método | Caminho | Resposta |
|--------|---------|----------|
| `GET` | `/contas-bancarias` | `200` — `{ "data": [ ... ] }` |
| `POST` | `/contas-bancarias` | `201` — objeto conta criada |

**Item em `data` / resposta do create:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | string | |
| `fornecedorId` | string | |
| `fornecedorNome` | string | Fantasia ou razão social |
| `bankFullName` | string | Nome do banco |
| `bankCode` | number \| null | Código Febraban (se informado) |
| `agencia` | string | Pode incluir dígito no formato `1234-5` |
| `conta` | string | Pode incluir dígito `12345-6` |
| `tipoConta` | string | `corrente` \| `poupanca` \| `pagamento` |
| `cadastradoEm` | string | ISO 8601 |

**Body `POST` (JSON):**

| Campo | Obrigatório | Notas |
|-------|-------------|--------|
| `fornecedorId` | sim | Número; deve existir no tenant |
| `bankIspb` | sim | |
| `bankFullName` | sim | |
| `agencia` | sim | |
| `conta` | sim | |
| `bankCode` | não | Número; omitir ou `null` se não usar |
| `agenciaDigito` | não | |
| `contaDigito` | não | |
| `tipoConta` | sim | `corrente`, `poupanca` ou `pagamento` |
| `pixChave` | não | |

**Exemplo `POST /contas-bancarias` (body):**

```json
{
  "fornecedorId": 3,
  "bankIspb": "60701190",
  "bankFullName": "Itaú Unibanco S.A.",
  "bankCode": 341,
  "agencia": "1234",
  "agenciaDigito": "5",
  "conta": "12345",
  "contaDigito": "6",
  "tipoConta": "corrente",
  "pixChave": "empresa@email.com"
}
```

**Exemplo `GET /contas-bancarias` (200):**

```json
{
  "data": [
    {
      "id": "7",
      "fornecedorId": "3",
      "fornecedorNome": "ABC Peças",
      "bankFullName": "Itaú Unibanco S.A.",
      "bankCode": 341,
      "agencia": "1234-5",
      "conta": "12345-6",
      "tipoConta": "corrente",
      "cadastradoEm": "2026-03-10T16:20:00.000Z"
    }
  ]
}
```

**Exemplo `POST /contas-bancarias` (201):** mesmo formato de um item de `data` (objeto único).

---

### 3.5 Financeiro

Rotas na **raiz** do app (sem prefixo `/financeiro`): `GET /dashboard`, `GET|POST /lancamentos-financeiros`, `GET|POST /contas-a-pagar`, `GET|POST /contas-a-receber`.

#### `GET /dashboard`

**Query opcional:** `ano` ou `year` (número, ex.: `2026`) — ano da **visão geral mensal** (12 meses). Default: ano UTC atual.

**Resposta 200** — objeto com blocos para o painel (estrutura enriquecida no backend; o front pode montar cards e gráficos):

| Chave (nível raiz) | Conteúdo típico |
|--------------------|-----------------|
| `meta` | Instantes de referência, ano da série mensal, intervalo da semana usado na movimentação semanal, mês dos KPIs |
| `resumo` | Totais em aberto (a receber / a pagar), recebimentos e pagamentos do mês com variação percentual vs mês anterior |
| `visaoGeralMensal` | Série Jan–Dez com recebimentos/pagamentos e totais do período |
| `movimentacaoSemanal` | Recebimentos e pagamentos por dia da semana corrente (UTC) |
| `composicaoFluxo` | Categorias com valores e percentuais, totais de lançamentos |
| `abrangenciaPorEstado` | Dados por UF (ex.: pagamentos ligados a fornecedor); notas quando algum eixo não existir no modelo |

**Exemplo `GET /dashboard?ano=2026` (200)** — valores ilustrativos. Em produção, `visaoGeralMensal.pontos` traz **12** objetos (Jan–Dez); abaixo há apenas dois para economizar espaço.

```json
{
  "meta": {
    "geradoEm": "2026-03-27T15:00:00.000Z",
    "fuso": "UTC",
    "anoReferenciaVisaoGeral": 2026,
    "semanaReferencia": { "inicio": "2026-03-24", "fim": "2026-03-30" },
    "mesReferenciaCartoes": { "ano": 2026, "mes": 3 }
  },
  "resumo": {
    "contasAReceberEmAberto": {
      "valor": 3500.5,
      "quantidadeTitulos": 12,
      "variacaoPercentual": null,
      "nota": "Variação percentual exige histórico de saldo; não calculada."
    },
    "contasAPagarEmAberto": {
      "valor": 4200,
      "quantidadeTitulos": 8,
      "variacaoPercentual": null,
      "nota": "Variação percentual exige histórico de saldo; não calculada."
    },
    "recebimentosDoMes": {
      "valor": 3500,
      "mesAnteriorValor": 3485,
      "variacaoPercentual": 0.43
    },
    "pagamentosDoMes": {
      "valor": 3500,
      "mesAnteriorValor": 3533.5,
      "variacaoPercentual": -0.95
    }
  },
  "visaoGeralMensal": {
    "granularidade": "mensal",
    "ano": 2026,
    "pontos": [
      { "mes": 1, "mesLabel": "Jan", "recebimentos": 100, "pagamentos": 120 },
      { "mes": 2, "mesLabel": "Fev", "recebimentos": 90, "pagamentos": 95 }
    ],
    "totaisPeriodo": {
      "totalRecebimentos": 580,
      "totalPagamentos": 628
    }
  },
  "movimentacaoSemanal": {
    "rotulo": "semana_atual_utc",
    "periodo": {
      "inicio": "2026-03-24T00:00:00.000Z",
      "fim": "2026-03-30T23:59:59.999Z"
    },
    "dias": [
      {
        "data": "2026-03-24",
        "diaSemana": 2,
        "diaSemanaLabel": "Ter",
        "recebimentos": 50,
        "pagamentos": 40
      }
    ]
  },
  "composicaoFluxo": {
    "periodo": {
      "tipo": "mes_corrente_utc",
      "inicio": "2026-03-01T00:00:00.000Z",
      "fim": "2026-03-31T23:59:59.999Z"
    },
    "totalLancamentos": 3605,
    "valorTotalComposto": 100000,
    "categorias": [
      {
        "key": "contas_a_receber",
        "label": "Contas a receber",
        "valor": 45076,
        "percentual": 45.076
      },
      {
        "key": "contas_a_pagar",
        "label": "Contas a pagar",
        "valor": 34951,
        "percentual": 34.951
      },
      {
        "key": "impostos_encargos",
        "label": "Impostos e encargos",
        "valor": 14979,
        "percentual": 14.979
      },
      {
        "key": "outros",
        "label": "Outros",
        "valor": 4994,
        "percentual": 4.994
      }
    ]
  },
  "abrangenciaPorEstado": {
    "fonte": "fornecedor.uf em lançamentos a pagar (caixa no mês)",
    "recebimentos": {
      "total": 1200,
      "nota": "Cliente não possui UF no modelo; mapa só reflete pagamentos por UF."
    },
    "pagamentosPorUf": [
      { "uf": "SP", "valor": 800, "percentual": 66.67 },
      { "uf": "RJ", "valor": 400, "percentual": 33.33 }
    ]
  }
}
```

#### `GET /lancamentos-financeiros`

**Query opcional:** `type` ou `kind` — filtra por `payable` ou `receivable`. Se omitido, retorna todos os lançamentos do tenant.

**Resposta 200:** `{ "data": [ ... ] }`

**Exemplo `GET /lancamentos-financeiros?type=payable` (200):**

```json
{
  "data": [
    {
      "id": "101",
      "kind": "payable",
      "valor": 1500.75,
      "dataVencimento": "2026-04-10",
      "dataPagamento": null,
      "contaBancariaId": "7",
      "contaBancariaNome": "Itaú Unibanco S.A. · Ag. 1234-5 · 12345-6",
      "counterpartyId": "3",
      "counterpartyName": "ABC Peças",
      "descricao": "NF 1234 - matéria-prima",
      "observacao": "",
      "recorrenciaAtiva": false,
      "recorrenciaTipo": "unica",
      "recorrenciaQuantidade": 1
    }
  ]
}
```

#### `GET /contas-a-pagar` / `GET /contas-a-receber`

Atalhos para listar apenas `payable` ou `receivable` (mesmo formato de item abaixo).

#### Item de lançamento (lista)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | string | |
| `kind` | string | `payable` \| `receivable` |
| `valor` | number | |
| `dataVencimento` | string | `YYYY-MM-DD` |
| `dataPagamento` | string \| null | `YYYY-MM-DD` ou `null` se em aberto |
| `contaBancariaId` | string | |
| `contaBancariaNome` | string | Rótulo amigável (banco + agência + conta) |
| `counterpartyId` | string | Id do fornecedor (a pagar) ou cliente (a receber) |
| `counterpartyName` | string | Nome exibido |
| `descricao` | string | |
| `observacao` | string | |
| `recorrenciaAtiva` | boolean | |
| `recorrenciaTipo` | string | `unica` \| `mensal` \| `anual` |
| `recorrenciaQuantidade` | number | |

#### `POST /lancamentos-financeiros`

**Body:** o tipo vem de `kind` ou `type`: `payable` \| `receivable`.

| Campo | Obrigatório | Notas |
|-------|-------------|--------|
| `kind` ou `type` | sim* | `payable` ou `receivable` |
| `valor` | sim | Número maior que zero |
| `dataVencimento` | sim | Data `YYYY-MM-DD` (interpretada em UTC no servidor) |
| `dataPagamento` | não | Se informado, título considerado pago nesta data |
| `contaBancariaId` | sim | Deve existir no tenant |
| `counterpartyId` | sim | **Fornecedor** se `payable`, **cliente** se `receivable` |
| `descricao` | não | |
| `observacao` | não | |
| `recorrenciaAtiva` | não | Default: falso → recorrência única |
| `recorrenciaTipo` | condicional | Se recorrência ativa: `unica`, `mensal` ou `anual` |
| `recorrenciaQuantidade` | condicional | Inteiro ≥ 1 se recorrência ativa |

\*Em `POST /contas-a-pagar` e `POST /contas-a-receber` o tipo é **fixo** no servidor (`payable` ou `receivable`); não é necessário (nem deve conflitar) enviar `kind`/`type` no body.

**Exemplo `POST /lancamentos-financeiros` — conta a pagar (body):**

```json
{
  "kind": "payable",
  "valor": 1500.75,
  "dataVencimento": "2026-04-10",
  "contaBancariaId": 7,
  "counterpartyId": 3,
  "descricao": "NF 1234 - matéria-prima"
}
```

(`type` pode ser usado no lugar de `kind`.)

**Exemplo `POST /lancamentos-financeiros` — conta a receber (body):**

```json
{
  "type": "receivable",
  "valor": 2500,
  "dataVencimento": "2026-04-15",
  "dataPagamento": "2026-03-28",
  "contaBancariaId": 7,
  "counterpartyId": 5,
  "descricao": "Fatura serviços",
  "recorrenciaAtiva": true,
  "recorrenciaTipo": "mensal",
  "recorrenciaQuantidade": 12
}
```

**Exemplo `POST /contas-a-pagar` (body)** — mesmo contrato, sem `kind`/`type`:

```json
{
  "valor": 800,
  "dataVencimento": "2026-05-01",
  "contaBancariaId": 7,
  "counterpartyId": 3,
  "descricao": "Aluguel galpão"
}
```

**Exemplo `POST /contas-a-receber` (body):**

```json
{
  "valor": 3200,
  "dataVencimento": "2026-05-10",
  "contaBancariaId": 7,
  "counterpartyId": 5,
  "descricao": "Contrato mensal"
}
```

**Exemplo resposta `POST` de lançamento (201):** mesmo formato do item da listagem (objeto único, sem wrapper `data`).

---

## 4. Fluxo sugerido no front

1. **Configurar** `BHOLD_API_BASE_URL` e o mesmo **`BHOLD_API_TOKEN`** (ou equivalente) que a API usa.
2. **Tela de login:** `GET /public/tenants` com `X-BHOLD-API-Token` → montar seleção de tenant (para usuários que não são SUPER).
3. **`POST /auth/login`** com email, senha e `tenantId` quando necessário → guardar `accessToken` (memória segura / httpOnly cookie conforme arquitetura do app).
4. **Chamadas autenticadas:** sempre `X-BHOLD-API-Token` + `Authorization: Bearer <accessToken>`; onde a doc acima pedir tenant, incluir `X-Tenant-Id`.

---

## 5. Erros

Formato típico:

```json
{ "error": "mensagem legível" }
```

Códigos usuais: `400`, `401` (token API, JWT ou credenciais), `403` (perfil/tenant), `404`, `409`, `503` (configuração no servidor, ex.: falta `BHOLD_API_TOKEN` em produção).

---

## 6. Super usuário (seed / testes)

Após `yarn prisma db seed` na API, existe um tenant `system` e um usuário **SUPER** (valores exatos no `prisma/seed.ts` da API).

- Login **sem** `tenantId` no body.
- Uso de rotas `/tenants` e `/usuarios` com JWT desse usuário.

**Importante:** credenciais de seed são apenas para desenvolvimento; altere ou desative em produção.

---

## 7. Variáveis de ambiente da API (referência)

| Variável | Função |
|----------|--------|
| `BHOLD_API_TOKEN` | Valor esperado no header `X-BHOLD-API-Token` |
| `JWT_SECRET` | Assinatura dos JWT |
| `JWT_EXPIRES_IN` | Expiração do JWT (ex.: `8h`) |
| `PUBLIC_TENANTS_MAX` | Limite de linhas em `GET /public/tenants` |

---

*Gerado a partir da estrutura de rotas do repositório `bholder-bff`. Em caso de divergência, o código-fonte das rotas prevalece.*
