# Feature Spec: Multi-Expense Capture

**ID:** FEAT-MCE  
**Status:** Specified  
**Scope:** Large  
**Component:** `apps/web-app/components/app/dashboard/CaptureMenu.tsx`

---

## Problem

O CaptureMenu atual permite registrar apenas **um** gasto por vez. Para usuários com múltiplos gastos num mesmo momento (ex: chegou em casa e quer registrar almoço + mercado + uber), o fluxo é lento: abre modal → registra → fecha → reabre. Isso eleva o atrito e desincentiva o registro.

---

## Goal

Permitir ao usuário registrar **N gastos em sequência numa única sessão de modal**, onde cada entrada tem seus próprios campos completos (incluindo escolha entre modo diário e fixo), e todos são submetidos em batch ao confirmar.

---

## Requirements

### REQ-MCE-01 — Lista de entradas no modal

- O modal exibe uma lista vertical de cards de entrada. Por padrão começa com **uma entrada**.
- Cada entrada tem um botão **"+ Adicionar outro gasto"** no rodapé da lista para inserir nova entrada.
- O número máximo de entradas por sessão é **10**.
- Quando o limite de 10 for atingido, o botão de adicionar fica desabilitado.

### REQ-MCE-02 — Tipo por entrada (Diário / Fixo)

- Cada entrada possui seu próprio seletor de tipo: **Diário** ou **Fixo / Parcelado**.
- O seletor substitui o toggle global que hoje existe acima do formulário.
- Ao trocar o tipo, os campos específicos daquela entrada são resetados (mantém apenas `amount` se já preenchido, para não forçar redigitar o valor).

### REQ-MCE-03 — Campos por entrada — modo Diário

Cada entrada no modo Diário contém exatamente os mesmos campos do formulário atual:

| Campo | Obrigatório | Regras |
|---|---|---|
| Valor (R$) | Sim | > 0, ≤ 999.999,99 |
| É reembolso? | Não | checkbox; inverte o sinal do valor |
| Descrição | Sim | 3–120 chars |
| Categoria | Não | dropdown, default "Outros" |
| Data | Sim | ≥ data mínima baseada em `isPreviousMonthConfigured` |
| Cartão de Crédito | Não | dropdown de cards; quando selecionado exige Fatura |
| Fatura | Condicional | obrigatório quando cartão selecionado |

### REQ-MCE-04 — Campos por entrada — modo Fixo / Parcelado

Cada entrada no modo Fixo contém exatamente os mesmos campos do formulário atual:

| Campo | Obrigatório | Regras |
|---|---|---|
| Mês de início | Sim | próximos 12 meses |
| Tipo de pagamento | Sim | Débito/PIX ou Cartão |
| Cartão | Condicional | obrigatório quando tipo = Cartão |
| Detalhes (via `ExpenseItem`) | Sim | nome, valor, tipo, dueDay, parcelamento |

### REQ-MCE-05 — Remoção de entradas

- Cada entrada possui um botão de remoção (ícone `Trash2`).
- A **primeira entrada não pode ser removida** quando há apenas uma entrada na lista.
- A partir da segunda entrada, todas são removíveis.

### REQ-MCE-06 — Validação por entrada

- A validação roda individualmente para cada entrada ao submeter.
- Erros são exibidos inline na entrada correspondente (mesmo padrão visual atual).
- A submissão só avança se **todas** as entradas passarem na validação.
- O modal faz scroll automático até a primeira entrada com erro.

### REQ-MCE-07 — Submissão em batch

- Ao clicar em "Adicionar" (ou equivalente), todas as entradas válidas são enviadas em **sequência** (não paralelo) para preservar a ordem e evitar sobrecarga de requisições.
- Entradas diárias usam `addExpense` do `BudgetContext`.
- Entradas fixas usam `createFixedExpense` do `BudgetContext`.
- Se qualquer requisição falhar, o erro é exibido na entrada correspondente e o processo para. Entradas já enviadas com sucesso são marcadas visualmente como "enviadas" e não são reenviadas.
- Ao término bem-sucedido de todas as entradas, o modal fecha e o formulário é resetado.

### REQ-MCE-08 — Estado de loading por entrada

- Enquanto uma entrada está sendo enviada, ela exibe um spinner e fica desabilitada para edição.
- O botão global de submissão exibe texto contextual: "Adicionando 1 de 3..." durante o envio em batch.

### REQ-MCE-09 — Reset ao fechar

- Fechar o modal (X ou Cancelar) descarta todas as entradas e reseta para o estado inicial (uma entrada vazia no modo Diário).

### REQ-MCE-10 — Acessibilidade e UX mobile

- O modal usa altura fixa responsiva (`h-[90vh]` no mobile e `md:h-[85vh]` em telas maiores) com scroll interno para acomodar múltiplas entradas.
- Cada card de entrada deve ter separação visual clara (borda, espaçamento) para distinguir entradas adjacentes.
- Header do card de entrada exibe: tipo atual, número sequencial ("Gasto 1", "Gasto 2"…) e botão de remoção.

### REQ-MCE-11 — Expansão controlada dos cards

- Sempre deve existir **exatamente um** card expandido na lista.
- Não é permitido minimizar manualmente o card atualmente expandido.
- Um card expandido só pode ser minimizado de forma indireta quando:
	- um novo gasto é adicionado (o novo card passa a ser o expandido), ou
	- outro card é expandido pelo usuário.
- Ao adicionar um novo gasto, ele deve abrir expandido automaticamente.

---

## Out of Scope

- Salvar rascunho / draft entre sessões.
- Reordenação de entradas via drag-and-drop.
- Importação de múltiplos gastos via arquivo/CSV.
- Edição de entradas já enviadas com sucesso dentro da mesma sessão de batch.

---

## Impacted Files

| Arquivo | Tipo de mudança |
|---|---|
| `components/app/dashboard/CaptureMenu.tsx` | Refatoração completa do estado e da UI |
| `components/app/dashboard/CaptureMenu/ExpenseEntryCard.tsx` | Novo componente (extrai lógica de uma entrada) |
| `components/app/dashboard/CaptureMenu/useExpenseEntries.ts` | Novo hook (gerencia lista de entradas + validação) |

---

## Acceptance Criteria

| ID | Critério |
|---|---|
| AC-01 | Usuário consegue adicionar até 10 entradas numa única sessão |
| AC-02 | Cada entrada tem tipo independente (Diário ou Fixo) |
| AC-03 | Validação falha por entrada e exibe erros inline corretamente |
| AC-04 | Submissão em batch envia todas as entradas em sequência |
| AC-05 | Falha em uma entrada mostra erro, para o batch e não reenvia entradas já concluídas |
| AC-06 | Modal fecha e reseta após sucesso completo |
| AC-07 | Botão de remoção desabilitado quando há apenas uma entrada |
| AC-08 | Scroll automático até a primeira entrada com erro |
| AC-09 | Estado de "enviada" visível por entrada durante/após batch |
| AC-10 | Toggle global de Diário/Fixo removido (substituído por seletor por entrada) |
| AC-11 | Modal mantém altura fixa responsiva com scroll interno (`h-[90vh]` / `md:h-[85vh]`) |
| AC-12 | Lista funciona como acordeão controlado: sempre 1 card expandido, sem minimizar manual do card ativo |
