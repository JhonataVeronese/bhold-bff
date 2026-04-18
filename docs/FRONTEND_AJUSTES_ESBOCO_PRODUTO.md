# Ajustes de front (alinhamento ao esboço de produto / BFF)

Este documento lista o que o **frontend** precisa contemplar após os ajustes do BFF alinhados à planilha de escopo (cadastros, financeiro, dashboard). **Centro de custo** fica fora deste escopo.

Documentação relacionada: `FRONTEND_CONTA_BANCARIA_FINANCEIRO.md`, `FRONTEND_FORMAS_PAGAMENTO.md`, `FRONTEND_API.md`.

---

## 1. Cliente **Consumidor final**

### Comportamento do backend

- Todo **tenant** passa a ter automaticamente um cliente com documento fixo `00000000000000` (equivalente ao CPF nota `000.000.000-00`).
- Razão social / nome fantasia padrão: **Consumidor final** (município/UF mínimos para validação).
- **Não** é possível `PATCH` nem `DELETE` nesse cadastro: a API responde **400** com mensagem explícita.
- Em **POST /clientes**, se o usuário informar documento só com zeros (ex.: `000.000.000-00`), o BFF normaliza para o mesmo CNPJ armazenado `00000000000000`; tentativa duplicada continua **409**.

### O que fazer no front

- **Não** exibir ações de editar/excluir para o cliente cujo `cnpj` (ou campo que o front use para documento) seja `00000000000000`.
- Na **venda / NF**, se o produto permitir trocar o nome exibido do consumidor final **sem persistir** (conforme regra de negócio), isso é **só UI / emissão**; o cadastro base permanece intocado.
- Garantir que fluxos de “novo cliente” não dependam de criar manualmente o consumidor final (ele já existe após provisionamento do tenant ou após seed).

---

## 2. Forma de pagamento **PIX** e primeira conta no banco

### Comportamento do backend

- Continua existindo **Carteira** + **Dinheiro** vinculado à Carteira (já documentado em `FRONTEND_CONTA_BANCARIA_FINANCEIRO.md`).
- Na **primeira** conta bancária da empresa cujo nome **não** seja `Carteira`, se a forma **PIX** ainda não tiver `contaBancariaEmpresaId`, o BFF **associa** o PIX a essa conta automaticamente.

### O que fazer no front

- Após criar a primeira conta “real”, ao listar **formas de pagamento**, esperar `contaBancariaEmpresaId` preenchido no PIX (quando aplicável).
- Manter a UI para o usuário **alterar** a conta padrão do PIX via cadastro de formas de pagamento, se o produto permitir múltiplos bancos.
- Não assumir que o PIX ficará sem conta após o primeiro cadastro bancário.

---

## 3. **Dashboard** financeiro — período “do dia 1 ao hoje”

**Rota:** `GET /dashboard`  
**Headers:** `Authorization`, `X-Tenant-Id` (padrão atual).

### Comportamento do backend

- Os cartões e blocos que antes usavam o **mês civil inteiro** (UTC) para caixa no mês passam a usar, por padrão, **do dia 1 do mês corrente até o dia atual (UTC)** — alinhado ao esboço (“mês em vigor do dia 01 até o dia que abrir”).
- A resposta inclui `meta.periodoPrincipal` com:
  - `origem`: `mes_corrente_ate_hoje_utc` ou `intervalo_personalizado`
  - `dataDe`, `dataAte` em `YYYY-MM-DD`
- Período **opcional** na query: informar **`dataDe` e `dataAte` juntos** (`YYYY-MM-DD`). Se enviar só um dos dois, a API retorna **400**.
- O gráfico **visão geral mensal** (`ano` via query) e totais anuais seguem a lógica já existente por ano; o que mudou é o **recorte dos KPIs “do mês”** ligados ao período principal.

### O que fazer no front

- Exibir **De / Até** usando `meta.periodoPrincipal.dataDe` e `dataAte` como default visual, com filtro para o usuário alterar (enviando o par na query).
- Ao comparar “mês atual” com “mês anterior” nos cartões de recebimentos/pagamentos, lembrar que o **mês atual** pode ser **parcial** (até hoje), enquanto o **mês anterior** no backend continua sendo o **mês fechado** completo — interpretar variação percentual com esse viés ou ajustar copy na UI.

---

## 4. **Resumo por período** (cards, gráfico, vencidas)

**Rota:** `GET /financeiro/resumo-periodo`

### Comportamento do backend

- **`dataDe` e `dataAte` opcionais.** Se **ambos** forem omitidos, o padrão é o mesmo do dashboard: **dia 1 do mês corrente até hoje (UTC)**.
- Se informar apenas um dos dois → **400** (mensagem pede os dois ou nenhum).
- `meta.periodoPadraoMesAteHojeUtc: true` quando o intervalo veio desse default.
- **`cards.saldoInicial`:** saldo na **véspera** de `dataDe` (movimentos de conta até essa data + recebidos quitados − pagos quitados até essa data).
- **`cards.saldoFinalRealizado`:** `saldoInicial` + recebidos quitados no intervalo − pagos quitados no intervalo.
- **`cards.saldoFinalEsperado`:** permanece `null` nesta versão do BFF (reservado para evolução).

### O que fazer no front

- Tela de resumo/dashboard detalhado pode **não** enviar datas na primeira carga e confiar no default do BFF.
- Rotular claramente **Saldo inicial** / **Saldo final realizado** conforme as definições acima para não confundir com “saldo atual global” sem recorte.
- Manter tabelas de **contas vencidas** já retornadas em `tables` (comportamento existente; `dataAte` do período influencia o critério de vencimento no backend).

---

## 5. Itens do esboço ainda **não** cobertos só pelo BFF / front

Para evitar escopo implícito:

- **Anexos** em contas a pagar/receber (upload/armazenamento).
- **Plano de contas** padrão, **taxas de cartão** amarradas a conta gerencial “Taxas de cartão” (contábil).
- **Perfil / módulos** (matriz de permissões) além do que o JWT/perfil atual já expõe.
- **Centro de custo** (explicitamente fora deste documento).

O front pode continuar exibindo placeholders ou telas “em definição” onde o BFF ainda não expõe API.

---

## 6. Checklist rápido

| Área | Ação |
|------|------|
| Clientes | Bloquear edição/exclusão do documento `00000000000000`; tratar 409 se tentar duplicar consumidor final |
| Formas de pagamento | Refletir PIX com conta após 1ª conta bancária real |
| `GET /dashboard` | Usar `meta.periodoPrincipal`; filtros `dataDe`+`dataAte` opcionais |
| `GET /financeiro/resumo-periodo` | Datas opcionais; novos significados de saldo inicial / final realizado |
| Copy / UX | Deixar claro período parcial do mês vs. mês anterior completo nas variações percentuais |

---

## 7. Provisionamento e ambientes antigos

- Tenants criados **antes** dessas mudanças podem não ter o cliente consumidor final até rodar o **seed** novamente (ou rotina que chame o ensure no BFF). O front pode tratar “lista sem consumidor” como estado transitório em homologação.
