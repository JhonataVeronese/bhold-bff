# Ajustes de Front: Conta Bancária e Financeiro

Este documento resume as mudanças que o front precisa fazer nesta etapa para suportar:

- cadastro de conta bancária com `nome`, `saldo inicial` e `data do saldo`
- conta padrão `Carteira`
- vínculo da forma de pagamento `Dinheiro` com a conta `Carteira`
- novos campos em `contas a pagar/receber`
- edição de lançamentos singulares
- exibição de movimentos de abertura no extrato

## Resumo Executivo

### O que mudou

- `Conta bancária da empresa` agora tem:
  - `nome`
  - `pixChave`
  - `dataSaldoInicial`
  - `saldoInicial`
- ao criar uma conta com saldo inicial, o backend gera um `movimento de abertura`
- cada tenant passa a ter automaticamente uma conta chamada `Carteira`
- a forma de pagamento `Dinheiro` fica vinculada à conta `Carteira`
- `contas a pagar/receber` ganharam:
  - `dataCompetencia`
  - `numeroDocumento`
  - `contaGerencial`
  - `pixChave`
- agora existe edição singular de:
  - `PATCH /contas-a-pagar/:id`
  - `PATCH /contas-a-receber/:id`
- o extrato agora pode retornar itens do tipo `movimento`, além de lançamentos

### O que não entrou nesta etapa

- upload de anexos
- armazenamento de arquivo/documento no backend
- tratamento de anexo em contas a pagar/receber

## Autenticação e Escopo

As rotas seguem o padrão já existente:

- `Authorization: Bearer <jwt>`
- `X-Tenant-Id: <id>`

## Conta Bancária da Empresa

Base:

- `GET /contas-bancarias/empresa`
- `POST /contas-bancarias/empresa`
- `DELETE /contas-bancarias/empresa/:id`

## Novo contrato de resposta da conta da empresa

Resposta de listagem:

```json
{
  "data": [
    {
      "id": "10",
      "escopo": "empresa",
      "nome": "Conta Principal",
      "bankFullName": "Banco do Brasil",
      "bankCode": 1,
      "agencia": "1234-5",
      "conta": "67890-1",
      "tipoConta": "corrente",
      "pixChave": "financeiro@empresa.com",
      "dataSaldoInicial": "2026-04-01",
      "saldoInicial": 1000,
      "cadastradoEm": "2026-04-11T18:00:00.000Z"
    }
  ]
}
```

### Campos novos

- `nome`
- `pixChave`
- `dataSaldoInicial`
- `saldoInicial`

## Novo payload de criação da conta da empresa

`POST /contas-bancarias/empresa`

Exemplo:

```json
{
  "nome": "Conta Principal",
  "bankIspb": "00000000",
  "bankCode": 1,
  "bankFullName": "Banco do Brasil",
  "agencia": "1234",
  "agenciaDigito": "5",
  "conta": "67890",
  "contaDigito": "1",
  "tipoConta": "corrente",
  "pixChave": "financeiro@empresa.com",
  "dataSaldoInicial": "2026-04-01",
  "saldoInicial": 1000
}
```

### Regras de UI

- `nome` é obrigatório
- `bankFullName`, `agencia` e `conta` continuam obrigatórios
- `bankIspb` pode ser opcional
- `saldoInicial` e `dataSaldoInicial` devem ser tratados em conjunto:
  - se o usuário informar um, deve informar o outro
- quando a conta for criada com saldo inicial, o backend gera um movimento de abertura automaticamente

### Regra de unicidade

No mesmo tenant, não pode existir outra conta da empresa com o mesmo `nome`.

O front deve tratar `409` para nome duplicado.

## Conta `Carteira`

Cada tenant agora terá uma conta padrão chamada:

- `Carteira`

### Como o front deve tratar

- não pedir para o usuário cadastrar a `Carteira` manualmente
- ela deve aparecer normalmente na listagem de contas da empresa
- pode ser exibida como opção em selects de conta
- a forma de pagamento `Dinheiro` poderá trazer `contaBancariaEmpresaId` apontando para a conta `Carteira`

## Formas de Pagamento: ajuste complementar

Além da documentação anterior de formas de pagamento, agora a resposta também traz:

- `contaBancariaEmpresaId`

Exemplo:

```json
{
  "id": "1",
  "nome": "Dinheiro",
  "tipo": "dinheiro",
  "contaBancariaEmpresaId": "3",
  "prazoDias": null,
  "taxaPercentual": null,
  "ativo": true,
  "padrao": true,
  "criadoEm": "2026-04-11T18:00:00.000Z",
  "atualizadoEm": "2026-04-11T18:00:00.000Z"
}
```

### Uso recomendado no front

Ao carregar `GET /formas-pagamento`:

- se `tipo === "dinheiro"` e vier `contaBancariaEmpresaId`, o front pode pré-selecionar a conta `Carteira`
- isso ajuda no fluxo de contas pagas/recebidas em dinheiro

## Contas a Pagar / Receber

Endpoints impactados:

- `POST /contas-a-pagar`
- `POST /contas-a-receber`
- `GET /contas-a-pagar`
- `GET /contas-a-receber`
- `GET /contas-a-pagar/:id`
- `GET /contas-a-receber/:id`
- `PATCH /contas-a-pagar/:id`
- `PATCH /contas-a-receber/:id`
- `PATCH /contas-a-pagar/:id/pagamento`
- `PATCH /contas-a-receber/:id/pagamento`

## Campos novos em lançamentos financeiros

Agora os itens de contas a pagar/receber também retornam:

- `dataCompetencia`
- `numeroDocumento`
- `contaGerencial`
- `pixChave`

Além dos campos da etapa anterior:

- `formaPagamentoId`
- `formaPagamentoNome`
- `formaPagamentoTipo`
- `contaBancariaDestinoId`
- `contaBancariaDestinoNome`

## Novo shape de resposta

Exemplo:

```json
{
  "id": "101",
  "kind": "payable",
  "valor": 1500,
  "dataCompetencia": "2026-04-01",
  "dataVencimento": "2026-04-30",
  "dataPagamento": null,
  "contaBancariaId": "10",
  "contaBancariaEmpresaId": "10",
  "contaBancariaNome": "Conta Principal",
  "contaBancariaDestinoId": null,
  "contaBancariaDestinoNome": null,
  "contaBancariaTerceiroId": "88",
  "contaBancariaTerceiroNome": "Banco XP · Ag. 1111 · 99999-0",
  "formaPagamentoId": "5",
  "formaPagamentoNome": "PIX",
  "formaPagamentoTipo": "pix",
  "counterpartyId": "25",
  "counterpartyName": "Fornecedor XPTO",
  "numeroDocumento": "NF-12345",
  "contaGerencial": "Despesas administrativas",
  "pixChave": "financeiro@fornecedor.com",
  "descricao": "Pagamento fornecedor XPTO",
  "recorrenciaAtiva": false,
  "recorrenciaTipo": "unica",
  "recorrenciaQuantidade": 1,
  "recorrenciaGrupoId": null,
  "recorrenciaParcela": null,
  "observacao": ""
}
```

## Novo payload de criação de contas a pagar/receber

### Exemplo conta a pagar

```json
{
  "valor": 1500,
  "dataCompetencia": "2026-04-01",
  "dataVencimento": "2026-04-30",
  "dataPagamento": null,
  "contaBancariaEmpresaId": 10,
  "counterpartyId": 25,
  "contaBancariaTerceiroId": 88,
  "formaPagamentoId": 5,
  "numeroDocumento": "NF-12345",
  "contaGerencial": "Despesas administrativas",
  "pixChave": "",
  "descricao": "Pagamento fornecedor XPTO",
  "observacao": "",
  "recorrenciaAtiva": false
}
```

### Regras

- `dataCompetencia`:
  - se o front não enviar, o backend usa a data atual
  - recomendado: enviar explicitamente
- `numeroDocumento`:
  - opcional
- `contaGerencial`:
  - opcional
- `pixChave`:
  - só deve ser enviada quando a forma de pagamento for `pix`

## Regras específicas por forma de pagamento

### `pix`

- permitir campo `pixChave`
- se não for `pix`, não enviar `pixChave`

### `transferencia`

- `contaBancariaDestinoId` é obrigatório
- conta destino deve ser diferente da origem

### `dinheiro`

- o front pode sugerir automaticamente a conta vinculada à forma `Dinheiro`
- na prática, isso tende a apontar para a `Carteira`

## Edição singular de conta a pagar/receber

Novos endpoints:

- `PATCH /contas-a-pagar/:id`
- `PATCH /contas-a-receber/:id`

Esses endpoints são para editar um lançamento individual.

### O que o front pode alterar

- `valor`
- `dataCompetencia`
- `dataVencimento`
- `dataPagamento`
- `formaPagamentoId`
- `contaBancariaDestinoId`
- `numeroDocumento`
- `contaGerencial`
- `pixChave`
- `descricao`
- `observacao`

### Exemplo

```json
{
  "valor": 1800,
  "dataCompetencia": "2026-04-05",
  "dataVencimento": "2026-05-10",
  "formaPagamentoId": 7,
  "contaBancariaDestinoId": null,
  "numeroDocumento": "BOLETO-123",
  "contaGerencial": "Fornecedores",
  "pixChave": "",
  "descricao": "Parcela ajustada",
  "observacao": "Alterado manualmente"
}
```

### Importante

- esse `PATCH` é singular
- ele não foi pensado para alterar toda a série recorrente
- no front, trate isso como edição de um único título

## Pagamento / Baixa

Os endpoints de pagamento continuam:

- `PATCH /contas-a-pagar/:id/pagamento`
- `PATCH /contas-a-receber/:id/pagamento`

Eles continuam aceitando:

- `dataPagamento`
- `contaBancariaTerceiroId`
- `observacao`

E também podem receber:

- `formaPagamentoId`
- `contaBancariaDestinoId`

Ou seja, o front pode:

- informar a data de pagamento
- alterar a forma no momento da baixa
- definir conta destino se for transferência

## Extrato: novo tipo de item

Além dos lançamentos financeiros, o extrato pode retornar itens de movimento de conta.

### Exemplo de item `movimento`

```json
{
  "id": "movimento-12",
  "lancamentoId": null,
  "kind": "movimento",
  "valor": 1000,
  "dataRef": "2026-04-01",
  "dataVencimento": "2026-04-01",
  "dataPagamento": "2026-04-01",
  "situacao": "realizado",
  "descricao": "Saldo inicial da conta",
  "contraParte": "",
  "contaLabel": "Conta Principal",
  "financeAccount": {
    "id": "10",
    "label": "Conta Principal"
  },
  "movimento": {
    "id": "12",
    "tipo": "abertura",
    "observacao": ""
  }
}
```

### Impacto no front

O front que renderiza extrato deve considerar:

- `kind = "payable"` ou `kind = "receivable"`: lançamento financeiro normal
- `kind = "movimento"`: movimento de conta

### Regras de renderização sugeridas

- se `kind === "movimento"`:
  - não tentar abrir detalhe de conta a pagar/receber
  - não tentar usar `lancamentoId`
  - mostrar como evento financeiro de conta
- se `lancamentoId === null`, trate como item não navegável para detalhe de título

## Fluxos que o front deve ajustar

### 1. Tela de cadastro de conta bancária

Adicionar:

- `nome`
- `pixChave`
- `dataSaldoInicial`
- `saldoInicial`

### 2. Tela/listagem de contas da empresa

Mostrar:

- `nome`
- `pixChave`
- `saldoInicial`
- `dataSaldoInicial`

### 3. Formulário de contas a pagar

Adicionar:

- `dataCompetencia`
- `numeroDocumento`
- `contaGerencial`
- `pixChave`

### 4. Formulário de contas a receber

Adicionar:

- `dataCompetencia`
- `numeroDocumento`
- `contaGerencial`
- `pixChave`

### 5. Tela de edição de título

Consumir:

- `PATCH /contas-a-pagar/:id`
- `PATCH /contas-a-receber/:id`

### 6. Extrato

Ajustar lista para suportar:

- itens de lançamento
- itens de movimento de abertura

### 7. Formas de pagamento

Ler `contaBancariaEmpresaId` para sugerir conta padrão por forma.

## Regras de UX recomendadas

- quando a forma for `pix`, exibir `pixChave`
- quando a forma não for `pix`, ocultar e limpar `pixChave`
- quando a forma for `transferencia`, exibir `contaBancariaDestinoId`
- quando a forma não for `transferencia`, ocultar e limpar `contaBancariaDestinoId`
- quando a forma for `dinheiro`, sugerir a conta padrão vinculada à forma
- em extrato, diferenciar visualmente `movimento` de `lancamento`

## Checklist para o Front

- ajustar tipagem de conta bancária da empresa
- ajustar tela de cadastro de conta bancária
- tratar conta `Carteira` como conta normal já provisionada
- usar `contaBancariaEmpresaId` vindo da forma de pagamento quando fizer sentido
- adicionar novos campos em contas a pagar/receber
- adicionar edição singular dos títulos
- adaptar extrato para `kind = movimento`
- não implementar anexo nesta etapa
