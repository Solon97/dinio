import { registerExpense } from '../../dinio/dinio-api-client'
import { formatCurrencyFromCents } from '../../responses/formatters'
import { IntentContext, ParsedIntent, ReplyFunction } from '../types'
import {
  capitalizeFirst,
  computeInvoiceDueMonthId,
  inferPaymentType,
  mapIntentCategoryToApiCategory,
  matchCardByName,
  resolveApiErrorMessage,
  resolveExpenseDate,
} from './helpers'
import { getCreditCards } from '../../dinio/dinio-api-client'
import type { PendingCardInfo } from '../../session/types'

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

/**
 * Registers multiple expenses in a single pass without interactive confirmation.
 *
 * Called when the LLM detects more than one `register_expense` operation in a
 * single user message (e.g. "uber 28, pizza 45, mercado 120").
 * Because the user explicitly listed all expenses in one go, we skip the
 * per-expense confirmation step and register them immediately, then show a
 * combined summary.
 */
export async function handleRegisterMultipleExpenses(
  intents: ParsedIntent[],
  context: IntentContext,
  reply: ReplyFunction,
): Promise<void> {
  // Pre-fetch credit cards once — reused for any credit expenses in the batch.
  let cards: PendingCardInfo[] = []
  const hasCreditExpense = intents.some(
    (i) => inferPaymentType(i.paymentType, i.cardNameMention) === 'credito',
  )
  if (hasCreditExpense) {
    try {
      cards = await getCreditCards(context.userId)
    } catch {
      // Continue without card info; credit expenses will have no card attached.
    }
  }

  const results: Array<{ description: string; amountInCents: number; ok: boolean }> = []

  for (const intent of intents) {
    const description = (intent.description ?? 'gasto').trim()
    const amountInReais = intent.amount ?? 0
    const amountInCents = Math.round(amountInReais * 100)

    if (amountInReais <= 0) {
      results.push({ description, amountInCents, ok: false })
      continue
    }

    const date = resolveExpenseDate(intent.expenseDate)
    if (!date) {
      results.push({ description, amountInCents, ok: false })
      continue
    }

    const category = mapIntentCategoryToApiCategory(intent.category)
    const paymentType = inferPaymentType(intent.paymentType, intent.cardNameMention)

    let creditCardId: string | undefined
    let invoiceDueMonthId: number | undefined

    if (paymentType === 'credito' && cards.length > 0 && intent.cardNameMention) {
      const matched = matchCardByName(cards, intent.cardNameMention)
      if (matched) {
        creditCardId = matched.id
        invoiceDueMonthId = computeInvoiceDueMonthId(date, matched.dueDay, matched.closingDay)
      }
    }

    try {
      await registerExpense({
        userId: context.userId,
        description,
        amountInReais,
        category,
        date,
        creditCardId,
        invoiceDueMonthId,
      })
      results.push({ description, amountInCents, ok: true })
    } catch (error) {
      // Log and continue — partial success is acceptable
      console.error({ error, description }, 'failed to register expense in bulk')
      results.push({ description, amountInCents, ok: false })
    }
  }

  await reply(buildBulkSummary(results))
}

// ---------------------------------------------------------------------------
// Summary builder
// ---------------------------------------------------------------------------

interface ExpenseResult {
  description: string
  amountInCents: number
  ok: boolean
}

function buildBulkSummary(results: ExpenseResult[]): string {
  const successful = results.filter((r) => r.ok)
  const failed = results.filter((r) => !r.ok)

  const lines: string[] = []

  if (successful.length > 0) {
    lines.push('Gastos registrados! 💸', '')
    for (const r of successful) {
      lines.push(
        `✅ ${capitalizeFirst(r.description)} — ${formatCurrencyFromCents(r.amountInCents)}`,
      )
    }
  }

  if (failed.length > 0) {
    if (successful.length > 0) lines.push('')
    lines.push(failed.length === 1 ? 'Não consegui registrar:' : 'Não consegui registrar alguns gastos:')
    for (const r of failed) {
      lines.push(`❌ ${capitalizeFirst(r.description)}`)
    }
    lines.push('', 'Tente registrá-los individualmente.')
  }

  if (successful.length === 0 && failed.length > 0) {
    return resolveApiErrorMessage(null, 'register')
  }

  return lines.join('\n')
}
