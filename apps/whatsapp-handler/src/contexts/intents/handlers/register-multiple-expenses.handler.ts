import { registerExpense } from '../../dinio/dinio-api-client'
import { formatCurrencyFromCents } from '../../responses/formatters'
import type { PendingCardInfo, PendingExpenseData } from '../../session/types'
import { sendButtonMessage } from '../../whatsapp/whatsapp-client'
import { IntentContext, ParsedIntent, ReplyFunction } from '../types'
import {
  buildBulkConfirmationText,
  capitalizeFirst,
  computeInvoiceDueMonthId,
  inferPaymentType,
  mapIntentCategoryToApiCategory,
  matchCardByName,
  resolveApiErrorMessage,
  resolveExpenseDate,
} from './helpers'
import { getCreditCards } from '../../dinio/dinio-api-client'

const CONFIRM_BUTTON_ID = 'confirm_expense'
const CONFIRM_BUTTON_TITLE = 'Confirmar ✅'

export const STEP_BULK_AWAITING_CONFIRMATION = 'bulk_awaiting_confirmation'

// ---------------------------------------------------------------------------
// Public entry point — builds pending list and asks for confirmation
// ---------------------------------------------------------------------------

/**
 * Handles multiple register_expense intents detected in a single message.
 *
 * Instead of registering immediately, this handler validates and resolves all
 * items, stores them in session, and sends a confirmation button message.
 * Registration happens in `handleBulkExpenseConfirmation` once the user
 * confirms.
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

  const pendingItems: PendingExpenseData[] = []

  for (const intent of intents) {
    const description = (intent.description ?? 'gasto').trim()
    const amountInReais = intent.amount ?? 0

    if (amountInReais <= 0) continue

    const date = resolveExpenseDate(intent.expenseDate)
    if (!date) continue

    const category = mapIntentCategoryToApiCategory(intent.category)
    const paymentType = inferPaymentType(intent.paymentType, intent.cardNameMention)
    const isRefund = intent.isRefund ?? false

    const item: PendingExpenseData = {
      description,
      amountInReais,
      category,
      date,
      paymentType,
      isRefund,
    }

    if (paymentType === 'credito' && cards.length > 0 && intent.cardNameMention) {
      const matched = matchCardByName(cards, intent.cardNameMention)
      if (matched) {
        item.card = matched
        item.invoiceDueMonthId = computeInvoiceDueMonthId(date, matched.dueDay, matched.closingDay)
      }
    }

    pendingItems.push(item)
  }

  if (pendingItems.length === 0) {
    await reply(resolveApiErrorMessage(null, 'register'))
    return
  }

  context.session.state = {
    intent: 'register_expense',
    step: STEP_BULK_AWAITING_CONFIRMATION,
  }
  context.session.operation = {
    type: 'register_expense',
    data: { items: pendingItems as unknown as Record<string, unknown>[] },
  }

  const confirmationText = buildBulkConfirmationText(pendingItems)
  await sendButtonMessage(context.phone, confirmationText, [
    { id: CONFIRM_BUTTON_ID, title: CONFIRM_BUTTON_TITLE },
  ])
}

// ---------------------------------------------------------------------------
// Confirmation step — called by the dispatcher after user clicks confirm
// ---------------------------------------------------------------------------

/**
 * Registers all items stored in the session after the user confirms.
 * Called when the previous step was `bulk_awaiting_confirmation` and the
 * user clicked the confirm button.
 */
export async function handleBulkExpenseConfirmation(
  context: IntentContext,
  reply: ReplyFunction,
): Promise<void> {
  const rawItems = (context.previousOperation?.data as { items?: unknown[] } | undefined)?.items
  if (!rawItems || rawItems.length === 0) {
    await reply(resolveApiErrorMessage(null, 'register'))
    return
  }

  const items = rawItems as PendingExpenseData[]
  const results: Array<{ description: string; amountInCents: number; isRefund: boolean; ok: boolean }> =
    []

  for (const item of items) {
    const amountInReais = item.isRefund ? -Math.abs(item.amountInReais) : item.amountInReais

    try {
      await registerExpense({
        userId: context.userId,
        description: item.description,
        amountInReais,
        category: item.category,
        date: item.date,
        creditCardId: item.card?.id,
        invoiceDueMonthId: item.invoiceDueMonthId,
      })
      results.push({
        description: item.description,
        amountInCents: Math.round(item.amountInReais * 100),
        isRefund: item.isRefund ?? false,
        ok: true,
      })
    } catch (error) {
      console.error({ error, description: item.description }, 'failed to register item in bulk')
      results.push({
        description: item.description,
        amountInCents: Math.round(item.amountInReais * 100),
        isRefund: item.isRefund ?? false,
        ok: false,
      })
    }
  }

  await reply(buildBulkSummary(results))
}

// ---------------------------------------------------------------------------
// Summary builder
// ---------------------------------------------------------------------------

interface ItemResult {
  description: string
  amountInCents: number
  isRefund: boolean
  ok: boolean
}

function buildBulkSummary(results: ItemResult[]): string {
  const successful = results.filter((r) => r.ok)
  const failed = results.filter((r) => !r.ok)

  if (successful.length === 0 && failed.length > 0) {
    return resolveApiErrorMessage(null, 'register')
  }

  const lines: string[] = []

  if (successful.length > 0) {
    const hasExpenses = successful.some((r) => !r.isRefund)
    const hasRefunds = successful.some((r) => r.isRefund)

    if (hasExpenses && hasRefunds) {
      lines.push('Gastos e reembolsos registrados! 🎉', '')
    } else if (hasRefunds) {
      lines.push('Reembolsos registrados! 💚', '')
    } else {
      lines.push('Gastos registrados! 💸', '')
    }

    for (const r of successful) {
      const icon = r.isRefund ? '💚' : '✅'
      lines.push(`${icon} ${capitalizeFirst(r.description)} — ${formatCurrencyFromCents(r.amountInCents)}`)
    }
  }

  if (failed.length > 0) {
    if (successful.length > 0) lines.push('')
    lines.push(
      failed.length === 1 ? 'Não consegui registrar:' : 'Não consegui registrar alguns itens:',
    )
    for (const r of failed) {
      lines.push(`❌ ${capitalizeFirst(r.description)}`)
    }
    lines.push('', 'Tente registrá-los individualmente.')
  }

  return lines.join('\n')
}
