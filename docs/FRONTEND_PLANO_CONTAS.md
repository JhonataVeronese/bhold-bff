# Ajustes de Front: Plano de Contas

Este documento descreve os endpoints novos de CRUD para `grupos de plano de contas` e `plano de contas`, além dos ajustes de telas e integração com lançamentos financeiros.

## Resumo

Foi adicionado no backend:

- CRUD completo de `grupos-plano-contas`
- CRUD completo de `plano-contas`
- Vínculo de `planoContaId` em `lancamentos financeiros`
- Regra de natureza por tipo de lançamento:
  - contas a pagar (`PAYABLE`) aceitam plano de conta de `debito`
  - contas a receber (`RECEIVABLE`) aceitam plano de conta de `credito`
- Registros inseridos via seed (`systemDefault: true`) **não podem ser alterados nem excluídos** (`409`)

## Autenticação e Escopo

As rotas seguem o padrão já existente:

- `Authorization: Bearer <jwt>`
- `X-Tenant-Id: <id do tenant>`

## Modelo de Dados (visão front)

### Grupo de plano de contas

- `id`: string
- `codigo`: string (ex.: `1`, `1.1`, `2`)
- `descricao`: string
- `nivel`: number
- `parentId`: string | null
- `parentCodigo`: string | null
- `parentDescricao`: string | null
- `systemDefault`: boolean — `true` quando veio do seed; não permitir edição nem exclusão na UI

### Plano de conta

- `id`: string
- `descricao`: string
- `natureza`: `debito | credito`
- `ativo`: boolean
- `systemDefault`: boolean — `true` quando veio do seed; não permitir edição nem exclusão na UI
- `grupo`:
  - `id`: string
  - `codigo`: string
  - `descricao`: string
  - `nivel`: number

## Endpoints: Grupos

Base: `/grupos-plano-contas`

### Listar grupos

`GET /grupos-plano-contas`

Resposta:

```json
{
  "data": [
    {
      "id": "1",
      "codigo": "1",
      "descricao": "OUTRAS RECEITAS",
      "nivel": 1,
      "parentId": null,
      "parentCodigo": null,
      "parentDescricao": null,
      "systemDefault": true,
      "criadoEm": "2026-04-29T14:00:00.000Z",
      "atualizadoEm": "2026-04-29T14:00:00.000Z"
    }
  ]
}
```

### Buscar grupo por id

`GET /grupos-plano-contas/:id`

### Criar grupo

`POST /grupos-plano-contas`

Payload:

```json
{
  "codigo": "1.1",
  "descricao": "RECEITAS OPERACIONAIS",
  "nivel": 2,
  "parentId": 1
}
```

Regras:

- `codigo`, `descricao` e `nivel` são obrigatórios
- `nivel` deve ser inteiro `>= 1`
- `codigo` deve ser único no tenant
- `parentId` é opcional
- quando informado, o `parentId` deve existir no mesmo tenant
- o pai deve ter nível menor que o filho

### Atualizar grupo

`PATCH /grupos-plano-contas/:id`

Payload: mesmo formato do create (objeto completo).

Bloqueio (`409`): grupo com `systemDefault: true` (seed) não pode ser alterado.

### Excluir grupo

`DELETE /grupos-plano-contas/:id`

Bloqueios (`409`):

- grupo inserido via seed (`systemDefault: true`)
- grupo com subgrupos
- grupo com contas vinculadas

## Endpoints: Plano de Contas

Base: `/plano-contas`

### Listar planos de conta

`GET /plano-contas`

Filtros opcionais por query:

- `natureza=debito|credito`
- `grupoId=<id>`
- `ativo=true|false`

Resposta:

```json
{
  "data": [
    {
      "id": "10",
      "descricao": "RECEITA DE BOLETOS",
      "natureza": "credito",
      "ativo": true,
      "systemDefault": true,
      "grupo": {
        "id": "2",
        "codigo": "1.1",
        "descricao": "RECEITAS OPERACIONAIS",
        "nivel": 2
      },
      "criadoEm": "2026-04-29T14:00:00.000Z",
      "atualizadoEm": "2026-04-29T14:00:00.000Z"
    }
  ]
}
```

### Buscar plano de conta por id

`GET /plano-contas/:id`

### Criar plano de conta

`POST /plano-contas`

Payload:

```json
{
  "descricao": "HONORÁRIOS CONTÁBEIS",
  "natureza": "debito",
  "grupoId": 4,
  "ativo": true
}
```

Regras:

- `descricao`, `natureza`, `grupoId` são obrigatórios
- `natureza` aceita somente `debito` ou `credito`
- `grupoId` deve existir no tenant
- `ativo` opcional (default `true`)

### Atualizar plano de conta

`PATCH /plano-contas/:id`

Payload: mesmo formato do create (objeto completo).

Bloqueio (`409`): plano com `systemDefault: true` (seed) não pode ser alterado.

### Excluir plano de conta

`DELETE /plano-contas/:id`

Bloqueios (`409`):

- plano inserido via seed (`systemDefault: true`)
- plano de conta já utilizado em lançamentos financeiros

## Impacto em Lançamentos Financeiros

Os endpoints de lançar/editar contas a pagar e a receber passam a aceitar:

- `planoContaId` (opcional)

Se o front enviar `planoContaId`:

- para `contas-a-pagar`, o plano deve ser de natureza `debito`
- para `contas-a-receber`, o plano deve ser de natureza `credito`

Campos novos na resposta dos lançamentos:

- `planoContaId`
- `planoContaDescricao`
- `planoContaNatureza`
- `planoContaGrupoCodigo`
- `planoContaGrupoDescricao`
- `planoContaGrupoNivel`

## Telas necessárias no Front

## 1) Tela de Grupos de Plano de Contas

- Listagem com colunas: código, descrição, nível, pai
- Ações: criar, editar, excluir — ocultar ou desabilitar editar/excluir quando `systemDefault === true`
- Formulário:
  - `codigo`
  - `descricao`
  - `nivel`
  - `parentId` (select opcional)

## 2) Tela de Plano de Contas

- Listagem com filtros:
  - natureza
  - grupo
  - ativo
- Ações: criar, editar, excluir — ocultar ou desabilitar editar/excluir quando `systemDefault === true`
- Formulário:
  - `descricao`
  - `natureza`
  - `grupoId`
  - `ativo`

## 3) Ajuste em Contas a Pagar/Receber

- No formulário de criação/edição, incluir campo `planoContaId`
- Carregar opções por tipo de lançamento:
  - pagar -> listar somente planos `debito` ativos
  - receber -> listar somente planos `credito` ativos

## 4) Ajuste em Listagem/Detalhe de Lançamentos

- Exibir informação do plano de conta vinculado (descrição e grupo)
- Exibir vazio quando `planoContaId` for `null`

## Regras de UX recomendadas

- No cadastro de grupo:
  - ao selecionar `parentId`, filtrar pais com nível menor que o nível informado
- No cadastro de plano:
  - ordenar grupos por código
  - mostrar `codigo - descricao` no select de grupo
- No lançamento:
  - filtrar automaticamente planos por natureza conforme tipo da tela
  - tratar erro `400` de natureza incompatível com mensagem amigável

## Checklist de implementação Front

- tipar e usar `systemDefault` nas listagens e formulários
- consumir CRUD de `grupos-plano-contas`
- consumir CRUD de `plano-contas`
- criar telas administrativas de grupos e planos
- adicionar `planoContaId` em criar/editar contas a pagar e receber
- atualizar tipagens de retorno de lançamentos com campos de plano de conta
- atualizar listagem/detalhe de lançamentos para exibir dados do plano
