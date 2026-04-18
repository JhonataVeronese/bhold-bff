# Ajustes de Front: Formas de Pagamento

Este documento resume tudo o que o front precisa ajustar para suportar o novo cadastro de `formas de pagamento` e o vínculo com `contas a pagar/receber`.

## Resumo

Foi adicionado no backend:

- Cadastro de `formas de pagamento` por tenant
- Seed de formas padrão para todos os tenants
- Provisionamento automático dessas formas ao criar um novo tenant
- Vínculo obrigatório da forma de pagamento no cadastro de lançamentos
- Regra especial para `transferencia`, exigindo conta de destino
- Novos campos nas respostas de `contas a pagar/receber` e `lancamentos financeiros`

## Autenticação e Escopo

As novas rotas seguem o mesmo padrão das rotas protegidas do sistema:

- `Authorization: Bearer <jwt>`
- `X-Tenant-Id: <id do tenant>`

O front deve continuar enviando o `X-Tenant-Id` em todas as chamadas protegidas por tenant.

## Formas Padrão Criadas por Tenant

Cada tenant passa a ter automaticamente estas formas:

- `PIX`
- `Dinheiro`
- `Transferência`
- `Cartão de Crédito`
- `Cartão de Débito`

Observações:

- `Cartão de Débito` nasce com `prazoDias = 1`
- As demais nascem com `prazoDias = null`
- Todas nascem com `ativo = true`
- Todas as formas padrão nascem com `padrao = true`

## Tipos Aceitos

O backend aceita estes valores em `tipo`:

- `dinheiro`
- `pix`
- `transferencia`
- `cartao_credito`
- `cartao_debito`
- `outros`

Para formas personalizadas, o front deve usar:

- `nome`: texto livre
- `tipo`: normalmente `outros`, a menos que queira reaproveitar um tipo conhecido com nome customizado

## Endpoints Novos

Base:

- `/formas-pagamento`

### 1. Listar formas de pagamento

`GET /formas-pagamento`

Resposta:

```json
{
  "data": [
    {
      "id": "1",
      "nome": "PIX",
      "tipo": "pix",
      "prazoDias": null,
      "taxaPercentual": null,
      "ativo": true,
      "padrao": true,
      "criadoEm": "2026-04-11T18:00:00.000Z",
      "atualizadoEm": "2026-04-11T18:00:00.000Z"
    }
  ]
}
```

Uso recomendado no front:

- preencher `select` de forma de pagamento
- filtrar apenas `ativo = true` na UI, se desejar esconder inativos
- destacar `padrao = true` visualmente, se fizer sentido

### 2. Buscar uma forma por id

`GET /formas-pagamento/:id`

Resposta:

```json
{
  "id": "1",
  "nome": "PIX",
  "tipo": "pix",
  "prazoDias": null,
  "taxaPercentual": null,
  "ativo": true,
  "padrao": true,
  "criadoEm": "2026-04-11T18:00:00.000Z",
  "atualizadoEm": "2026-04-11T18:00:00.000Z"
}
```

### 3. Criar forma de pagamento

`POST /formas-pagamento`

Payload:

```json
{
  "nome": "Boleto 28 dias",
  "tipo": "outros",
  "prazoDias": 28,
  "taxaPercentual": null,
  "ativo": true
}
```

Regras:

- `nome` é obrigatório
- `tipo` é obrigatório
- `prazoDias` é opcional, mas quando enviado deve ser inteiro `>= 0`
- `taxaPercentual` é opcional, mas quando enviada deve ser número `>= 0`
- `ativo` é opcional; se omitido, o backend assume `true`
- não pode existir outra forma com o mesmo `nome` no mesmo tenant

### 4. Atualizar forma de pagamento

`PATCH /formas-pagamento/:id`

Payload:

```json
{
  "nome": "Cartão Crédito 30 dias",
  "tipo": "cartao_credito",
  "prazoDias": 30,
  "taxaPercentual": 2.99,
  "ativo": true
}
```

Importante:

- atualmente o backend espera o objeto completo, não apenas campos parciais
- ou seja, no `PATCH`, o front deve reenviar todos os campos do formulário

### 5. Excluir forma de pagamento

`DELETE /formas-pagamento/:id`

Regra:

- se a forma já tiver sido usada em algum lançamento, a API retorna `409`

Mensagem esperada:

```json
{
  "error": "Esta forma de pagamento já foi usada em lançamentos e não pode ser excluída"
}
```

## Mudanças em Contas a Pagar / Receber

Os seguintes endpoints foram impactados:

- `POST /lancamentos-financeiros`
- `POST /contas-a-pagar`
- `POST /contas-a-receber`
- `GET /lancamentos-financeiros`
- `GET /contas-a-pagar`
- `GET /contas-a-receber`
- `GET /contas-a-pagar/:id`
- `GET /contas-a-receber/:id`
- `PATCH /contas-a-pagar/:id/pagamento`
- `PATCH /contas-a-receber/:id/pagamento`

### Novos campos no create de lançamento

Agora o front deve enviar:

- `formaPagamentoId`: obrigatório
- `contaBancariaDestinoId`: obrigatório apenas quando a forma for `transferencia`

### Exemplo: conta a pagar com PIX

```json
{
  "valor": 1500,
  "dataVencimento": "2026-04-30",
  "contaBancariaEmpresaId": 10,
  "counterpartyId": 25,
  "contaBancariaTerceiroId": 88,
  "formaPagamentoId": 3,
  "descricao": "Pagamento fornecedor XPTO",
  "observacao": "",
  "recorrenciaAtiva": false
}
```

### Exemplo: conta a pagar com transferência

```json
{
  "valor": 1500,
  "dataVencimento": "2026-04-30",
  "contaBancariaEmpresaId": 10,
  "contaBancariaDestinoId": 11,
  "counterpartyId": 25,
  "formaPagamentoId": 5,
  "descricao": "Transferência interna para pagamento",
  "observacao": "",
  "recorrenciaAtiva": false
}
```

### Regras para transferência

Se a forma escolhida for `transferencia`:

- `contaBancariaDestinoId` passa a ser obrigatório
- a conta destino deve existir no mesmo tenant
- a conta destino deve ser diferente da conta origem

Se a forma escolhida não for `transferencia`:

- o front não deve enviar `contaBancariaDestinoId`

## Mudanças na resposta de lançamentos

Além dos campos antigos, as respostas agora incluem:

- `contaBancariaDestinoId`
- `contaBancariaDestinoNome`
- `formaPagamentoId`
- `formaPagamentoNome`
- `formaPagamentoTipo`

Exemplo de item retornado:

```json
{
  "id": "101",
  "kind": "payable",
  "valor": 1500,
  "dataVencimento": "2026-04-30",
  "dataPagamento": null,
  "contaBancariaId": "10",
  "contaBancariaEmpresaId": "10",
  "contaBancariaNome": "Banco X · Ag. 1234 · 99999-0",
  "contaBancariaDestinoId": "11",
  "contaBancariaDestinoNome": "Banco Y · Ag. 2222 · 12345-6",
  "contaBancariaTerceiroId": null,
  "contaBancariaTerceiroNome": null,
  "formaPagamentoId": "5",
  "formaPagamentoNome": "Transferência",
  "formaPagamentoTipo": "transferencia",
  "counterpartyId": "25",
  "counterpartyName": "Fornecedor XPTO",
  "descricao": "Transferência interna para pagamento",
  "recorrenciaAtiva": false,
  "recorrenciaTipo": "unica",
  "recorrenciaQuantidade": 1,
  "recorrenciaGrupoId": null,
  "recorrenciaParcela": null,
  "observacao": ""
}
```

## Mudanças no PATCH de pagamento

Endpoints:

- `PATCH /contas-a-pagar/:id/pagamento`
- `PATCH /contas-a-receber/:id/pagamento`

Campos antigos continuam válidos:

- `dataPagamento`
- `contaBancariaTerceiroId`
- `observacao`

Campos novos aceitos:

- `formaPagamentoId`
- `contaBancariaDestinoId`

Exemplo:

```json
{
  "dataPagamento": "2026-04-30",
  "formaPagamentoId": 5,
  "contaBancariaDestinoId": 11,
  "observacao": "Quitado por transferência"
}
```

Observação importante:

- no `PATCH /pagamento`, `formaPagamentoId` não é obrigatório se o front não quiser alterar a forma
- mas se o front enviar `formaPagamentoId` com uma forma `transferencia`, deve enviar também `contaBancariaDestinoId`

## Impactos Diretos no Front

### 1. Tela de cadastro de contas a pagar/receber

Adicionar no formulário:

- campo `formaPagamentoId`
- campo condicional `contaBancariaDestinoId`

Comportamento:

- carregar formas via `GET /formas-pagamento`
- quando `formaPagamentoTipo === "transferencia"`, exibir select de conta destino
- quando não for transferência, ocultar e limpar conta destino

### 2. Tela de edição/baixa/pagamento

Se existir formulário de quitação:

- permitir informar ou alterar `formaPagamentoId`
- mostrar `contaBancariaDestinoId` apenas em transferência

### 3. Listagem e detalhe de lançamentos

Atualizar colunas/detalhes para suportar:

- nome da forma de pagamento
- tipo da forma
- conta destino, quando existir

### 4. Tela administrativa de formas de pagamento

Criar tela com:

- listagem
- criação
- edição
- exclusão

Campos mínimos:

- `nome`
- `tipo`
- `prazoDias`
- `taxaPercentual`
- `ativo`

## Regras de UX recomendadas

- `tipo = transferencia`:
  - tornar `contaBancariaDestinoId` obrigatório
  - impedir selecionar a mesma conta da origem
- `tipo != transferencia`:
  - esconder `contaBancariaDestinoId`
- para `cartao_credito` e `cartao_debito`:
  - faz sentido exibir `prazoDias` e `taxaPercentual`
- para `pix` e `dinheiro`:
  - pode esconder `prazoDias` e `taxaPercentual`, se a UI quiser simplificar

## Limitações Atuais do Backend

Estas regras ainda nao foram implementadas no backend:

- vínculo de taxa com plano de contas / conta gerencial
- regras especiais de parcelamento por cartão
- operação financeira separada para transferência entre contas sem contrapartida de pagar/receber

Ou seja: o front deve considerar que, no estado atual, `transferencia` é apenas uma forma de pagamento do lançamento, com conta origem e destino.

## Checklist de Ajuste no Front

- consumir `GET /formas-pagamento`
- criar CRUD de formas de pagamento
- adicionar `formaPagamentoId` no create de contas a pagar/receber
- adicionar `contaBancariaDestinoId` para transferência
- atualizar tipagens/interfaces dos lançamentos com os novos campos
- atualizar telas de listagem e detalhe
- atualizar fluxo de quitação para aceitar nova forma e conta destino
