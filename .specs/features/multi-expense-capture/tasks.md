# Tasks: Multi-Expense Capture (FEAT-MCE)

**Status:** Done  
**Spec:** [spec.md](./spec.md)

---

## Dependency Map

```
T1 ──→ T2 ──→ T4
         ↘
          T3 ──→ T4 ──→ T5 ──→ T6
```

- **T1** e **T2** devem ser executadas em sequência (fundação de tipos/estado → hook)
- **T3** pode ser iniciada em paralelo com T2 (componente visual independente do hook)
- **T4** depende de T2 e T3
- **T5** depende de T4
- **T6** depende de T5

---

## T1 — Definir tipos e estado central de uma entrada

**Status:** Done

**What:** Criar o arquivo de tipos `ExpenseEntry` que representa o estado completo de uma única linha de gasto no multi-capture.

**Where:** `components/app/dashboard/CaptureMenu/types.ts` *(novo)*

**Depends on:** nada

**What to create:**

```ts
// Estado de uma entrada diária
interface DailyEntryState {
  amount: number;
  description: string;
  category: string;
  isRefund: boolean;
  date: string;          // YYYY-MM-DD
  cardId: string;
  invoiceMonthId: string;
}

// Estado de uma entrada fixa
interface FixedEntryState {
  name: string;
  amount: number;
  dueDay: number;
  type: ExpenseType;
  paid: boolean;
  isInstallment: boolean;
  totalInstallments?: number;
  startInstallment?: number;
  isRefundable: boolean;
  paymentType: "debit" | "card";
  cardId: string;
  targetMonth: string;   // "YYYY-MM"
}

type EntryMode = "daily" | "fixed";
type EntryStatus = "idle" | "submitting" | "success" | "error";

interface DailyEntryErrors {
  amount?: string;
  description?: string;
  date?: string;
  card?: string;
  general?: string;
}

interface FixedEntryErrors {
  name?: string;
  amount?: string;
  card?: string;
  installments?: string;
  general?: string;
}

interface ExpenseEntry {
  id: string;            // gerado client-side: `temp-${Date.now()}-${Math.random()}`
  mode: EntryMode;
  status: EntryStatus;
  daily: DailyEntryState;
  fixed: FixedEntryState;
  errors: DailyEntryErrors | FixedEntryErrors;
}
```

**Done when:**
- [x] Arquivo `types.ts` criado com todos os tipos exportados
- [x] Sem erros de TypeScript (`tsc --noEmit`)

**Gate:** `cd apps/web-app && npx tsc --noEmit`

---

## T2 — Criar hook `useExpenseEntries`

**Status:** Done

**What:** Hook que gerencia a lista de `ExpenseEntry[]`, expõe ações de CRUD da lista e a função `validateAll()`.

**Where:** `components/app/dashboard/CaptureMenu/useExpenseEntries.ts` *(novo)*

**Depends on:** T1

**Responsabilidades:**

- `entries: ExpenseEntry[]` — lista reativa
- `addEntry()` — append nova entrada com defaults; bloqueia se `entries.length >= 10`
- `removeEntry(id)` — remove entrada; ignora se só há uma entrada
- `updateEntryField(id, mode, field, value)` — atualiza campo de uma entrada; ao trocar `mode`, reseta campos do modo antigo (preserva `amount`)
- `setEntryStatus(id, status, errorMessage?)` — atualiza status e `errors.general` de uma entrada
- `validateAll(): { valid: boolean; firstInvalidId?: string }` — valida cada entry com as mesmas regras de `validateDailyForm` / `validateFixedForm` já existentes no `CaptureMenu.tsx`; popula `errors` por entry; retorna id da primeira entrada inválida
- `resetEntries()` — volta para estado inicial (uma entrada vazia em modo `daily`)
- `getDefaultTargetMonth()` — próximo mês como `"YYYY-MM"` (extrai lógica hoje inline no componente)
- `getDefaultDate()` — hoje como `"YYYY-MM-DD"`

**Função de validação:**
- Extrair `validateDailyForm` e `validateFixedForm` do `CaptureMenu.tsx` atual para dentro deste hook (ou para `utils.ts` colocalizado)
- Adaptar para operar sobre `DailyEntryState` / `FixedEntryState` em vez de parâmetros avulsos

**Done when:**
- [x] Hook criado e exportado
- [x] `validateAll` popula `errors` corretamente em cada entry
- [x] `updateEntryField` com troca de `mode` preserva `amount`
- [x] `addEntry` bloqueia após 10 entradas
- [x] `removeEntry` é no-op com uma entrada
- [x] Sem erros TypeScript

**Gate:** `cd apps/web-app && npx tsc --noEmit`

---

## T3 — Criar componente `ExpenseEntryCard`

**Status:** Done

**What:** Componente que renderiza um único card de entrada — header (número, tipo, botão remover) + toggle de modo + formulário condicional (diário ou fixo).

**Where:** `components/app/dashboard/CaptureMenu/ExpenseEntryCard.tsx` *(novo)*

**Depends on:** T1 (types), independente de T2

**Props:**

```ts
interface ExpenseEntryCardProps {
  entry: ExpenseEntry;
  index: number;           // para exibir "Gasto 1", "Gasto 2"…
  canRemove: boolean;      // false quando é a única entrada
  creditCards: CreditCard[];
  minDate: string;         // YYYY-MM-DD
  onModeChange: (id: string, mode: EntryMode) => void;
  onFieldChange: (id: string, mode: EntryMode, field: string, value: unknown) => void;
  onRemove: (id: string) => void;
  // helpers
  getDefaultInvoiceMonthIdForCard: (cardId: string) => string;
  getDailyInvoiceMonthOptions: (entry: ExpenseEntry) => { value: string; label: string }[];
  getTargetMonthOptions: () => { value: string; label: string }[];
}
```

**UI — Header do card:**
- Badge/label "Gasto {index + 1}"
- Toggle de modo (Diário / Fixo) compacto — estilo pill igual ao toggle global atual
- Botão `Trash2` (desabilitado + `opacity-50` quando `!canRemove`)

**UI — Status overlay:**
- Quando `entry.status === "submitting"`: overlay semi-transparente + spinner sobre o card
- Quando `entry.status === "success"`: borda verde + checkmark no header ("✓ Enviado")
- Quando `entry.status === "error"`: `errors.general` já é exibido via campo inline

**UI — Formulário Diário:** extrato exato dos campos diários do `CaptureMenu.tsx` atual, adaptado para usar `entry.daily.*` e `onFieldChange`.

**UI — Formulário Fixo:** extrato exato dos campos fixos do `CaptureMenu.tsx` atual, adaptado para usar `entry.fixed.*` e `onFieldChange`. Mantém o `<ExpenseItem>` reutilizável.

**Separação visual entre cards:** `border border-slate-200 rounded-2xl p-4 shadow-sm`

**Done when:**
- [x] Componente renderiza sem erros para modo diário e fixo
- [x] Overlay de submitting funcional
- [x] Estado de sucesso exibe estilo visual diferenciado
- [x] Sem erros TypeScript

**Gate:** `cd apps/web-app && npx tsc --noEmit`

---

## T4 — Refatorar `CaptureMenu.tsx`

**Status:** Done

**What:** Substituir toda a lógica de estado e UI atual por orquestração via `useExpenseEntries` + lista de `<ExpenseEntryCard>`.

**Where:** `components/app/dashboard/CaptureMenu.tsx`

**Depends on:** T2, T3

**O que remover:**
- Todos os `useState` de campos individuais (amount, description, category, isRefund, selectedDate, selectedDailyCardId, selectedDailyInvoiceMonthId, fixedExpense, fixedPaymentType, selectedCardId, fixedTargetMonth, dailyErrors, fixedErrors)
- `captureMode` state global
- `validateDailyForm` e `validateFixedForm` (movidas para o hook)
- `handleDailySubmit` e `handleFixedSubmit` por inteiro
- Toggle de modo no header do modal

**O que manter:**
- `showTextModal`, `isSubmitting` states (orquestração do modal e batch)
- `creditCards` state + `useEffect` de fetch
- `handleTextClick`, `handleCloseModal` (chama `resetEntries()`)
- `getMinDate()` helper
- FAB (Floating Action Button) no rodapé

**O que adicionar:**
- `const { entries, addEntry, removeEntry, updateEntryField, setEntryStatus, validateAll, resetEntries } = useExpenseEntries()`
- `handleBatchSubmit`: valida tudo → scroll para primeiro inválido → loop sequencial por entry → chama `addExpense` ou `createFixedExpense` conforme `entry.mode` → atualiza status por entry → fecha modal se tudo OK
- Botão de submit global com texto contextual ("Adicionar", "Adicionando X de Y...")
- Botão "+ Adicionar outro gasto" com contagem e desabilitado em ≥ 10

**Scroll para erro:**
```ts
const entryRefs = useRef<Record<string, HTMLDivElement | null>>({});
// na validação: entryRefs.current[firstInvalidId]?.scrollIntoView({ behavior: "smooth", block: "start" })
```

**Done when:**
- [x] Modal abre com uma entrada vazia
- [x] Adicionar/remover entradas funciona
- [x] Submit chama `handleBatchSubmit` e envia sequencialmente
- [x] Fechar reseta para estado inicial
- [x] Sem erros TypeScript

**Gate:** `cd apps/web-app && npx tsc --noEmit`

---

## T5 — Verificação visual e de comportamento (manual)

**Status:** Done

**What:** Testar o fluxo completo na UI em dev.

**Where:** browser / `npm run dev`

**Depends on:** T4

**Checklist:**

- [x] AC-01: adicionar 10 entradas; botão desabilita na 11ª
- [x] AC-02: cada entrada com modo independente; troca de modo preserva amount
- [x] AC-03: validação com erros inline por entrada; erros não cruzam entre entradas
- [x] AC-04: submissão em batch sequencial (inspecionar Network tab na devtools)
- [x] AC-05: simular falha em entry 2 de 3; entry 1 marcada como sucesso; entry 2 com erro; não tenta entry 3
- [x] AC-06: sucesso total fecha modal e reseta
- [x] AC-07: botão trash desabilitado com uma entrada; habilitado com duas
- [x] AC-08: scroll automático até a entrada com erro
- [x] AC-09: overlay de submitting visível por card
- [x] AC-10: não há mais toggle global; cada card tem seu próprio seletor
- [x] AC-11: modal mantém altura fixa responsiva com scroll interno (`h-[90vh]` / `md:h-[85vh]`)
- [x] AC-12: sempre existe 1 card expandido; card ativo não pode ser minimizado manualmente

**Done when:** todos os ACs marcados sem regressão nas funcionalidades existentes.

---

## T6 — Lint e build de produção

**Status:** Done

**What:** Garantir que o projeto compila limpo após todas as mudanças.

**Where:** `apps/web-app`

**Depends on:** T5

**Commands:**
```bash
cd apps/web-app
npm run lint
npm run build
```

**Done when:**
- [x] `npm run lint` sem erros
- [x] `npm run build` compila sem erros
- [x] `npm run test` passa (nenhum teste unitário existente deve quebrar)

**Gate:** saída dos três comandos sem falhas.

---

## Status Summary

| Task | Status | Gate |
|---|---|---|
| T1 — Tipos e estado | done | tsc --noEmit |
| T2 — Hook `useExpenseEntries` | done | tsc --noEmit |
| T3 — `ExpenseEntryCard` | done | tsc --noEmit |
| T4 — Refatorar `CaptureMenu.tsx` | done | tsc --noEmit |
| T5 — Verificação visual | done | checklist manual |
| T6 — Lint + build | done | npm run lint + build |
