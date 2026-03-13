# packages/shared

Pacote TypeScript compartilhado entre `apps/web-app` e `apps/whatsapp-handler`.

Faz parte do monorepo pnpm — **não é publicado em nenhum registry externo**. Os apps consomem o pacote diretamente via `workspace:*`.

---

## Uso nos apps

```json
"dinio-shared": "workspace:@solon97/dinio-shared@*"
```

```ts
import { computeInvoiceDueMonthIdForDate, formatMonthIdLabel } from 'dinio-shared'
import { addMonths, getCurrentMonthId } from 'dinio-shared/invoice-cycle'
```

---

## Desenvolvimento

Após alterar qualquer arquivo em `src/`, recompile:

```bash
cd packages/shared
pnpm build        # compila tsc → dist/
```

Os apps resolvem o pacote pelo workspace e enxergam as mudanças imediatamente após o build — sem publish, sem bump de versão.

Para compilar em watch mode durante o desenvolvimento:

```bash
npx tsc --watch
```

---

## Estrutura

```
packages/shared/
├── src/
│   ├── index.ts              # re-exports tudo de invoice-cycle/
│   └── invoice-cycle/
│       ├── index.ts
│       ├── month-id.ts
│       └── normalize.ts
└── dist/                     # gerado pelo build (não commitar)
```

---

## Exports

**Invoice cycle** (via `'dinio-shared'` ou `'dinio-shared/invoice-cycle'`):

| Export | Descrição |
|---|---|
| `computeInvoiceDueMonthIdForDate(date, dueDay, closingDay)` | YYYYMM do ciclo de fatura de uma despesa |
| `getEffectiveClosingDay(closingDay, dueDay)` | Dia de fechamento com fallback (dueDay − 7) |
| `formatMonthIdLabel(monthId)` | `"Janeiro 2026"` a partir de YYYYMM |

**Month ID utilities:**

| Export | Descrição |
|---|---|
| `computeMonthId(year, month)` | YYYYMM a partir de ano + mês (0-based) |
| `computeMonthIdFromDate(date)` | YYYYMM a partir de `Date` |
| `computeMonthIdFromString(dateString)` | YYYYMM a partir de `"YYYY-MM-DD"` |
| `parseMonthId(monthId)` | `{ year, month }` a partir de YYYYMM |
| `getCurrentMonthId()` | Mês atual como YYYYMM |
| `addMonths(monthId, n)` | Adiciona ou subtrai meses |
| `getPreviousMonthId(monthId)` / `getNextMonthId(monthId)` | Meses adjacentes |
| `isMonthInPast` / `isCurrentMonth` / `isMonthInFuture` | Comparações de mês |
| `isValidMonthId(monthId)` | Valida YYYYMM (anos 2020–2100) |

---

## Regra

Nunca reimplemente lógica de ciclo de fatura ou aritmética de month ID nos apps. Se uma função necessária não existir aqui, adicione-a neste pacote.
