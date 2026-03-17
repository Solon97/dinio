import { registerReimbursement } from '../../dinio/dinio-api-client'
import { formatCurrencyFromCents } from '../../responses/formatters'
import type { PendingReimbursementData } from '../../session/types'
import { sendButtonMessage } from '../../whatsapp/whatsapp-client'
import { ParsedIntent, IntentContext, ReplyFunction } from '../types'
import {
  buildReimbursementConfirmationText,
  capitalizeFirst,
  mapIntentCategoryToApiCategory,
  resolveApiErrorMessage,
  resolveExpenseDate,
} from './helpers'

const CONFIRM_BUTTON_ID = 'confirm_reimbursement'
const CONFIRM_BUTTON_TITLE = 'Confirmar ✅'

// ---------------------------------------------------------------------------
// Step identifiers for the register_reimbursement multi-turn flow
// ---------------------------------------------------------------------------

const STEP_AWAITING_CONFIRMATION = 'awaiting_confirmation'

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export async function handleRegisterReimbursement(
  intent: ParsedIntent,
  context: IntentContext,
  reply: ReplyFunction,
): Promise<void> {
  const { previousState, previousOperation, interactiveReplyId } = context

  const isPendingReimbursementFlow =
    previousState?.intent === 'register_reimbursement' &&
    previousState.step === STEP_AWAITING_CONFIRMATION

  if (isPendingReimbursementFlow) {
    const pendingData = previousOperation?.data as PendingReimbursementData | undefined

    if (!pendingData) {
      return startNewReimbursementFlow(intent, context, reply)
    }

    if (interactiveReplyId === CONFIRM_BUTTON_ID) {
      return persistReimbursement(pendingData, context, reply)
    }

    return handleFieldEdit(intent, pendingData, context, reply)
  }

  return startNewReimbursementFlow(intent, context, reply)
}

// ---------------------------------------------------------------------------
// Step: start a new reimbursement flow from a fresh intent
// ---------------------------------------------------------------------------

async function startNewReimbursementFlow(
  intent: ParsedIntent,
  context: IntentContext,
  reply: ReplyFunction,
): Promise<void> {
  if (intent.amount == null || intent.amount <= 0) {
    await reply(
      [
        'Não peguei o valor desse reembolso 💚',
        '',
        'Me manda o valor que eu registro para você.',
      ].join('\n'),
    )
    return
  }

  const date = resolveExpenseDate(intent.expenseDate)
  if (!date) {
    await reply(
      [
        'Não consegui entender a data desse reembolso 📅',
        '',
        'Me manda no formato dia/mês/ano, por exemplo: "10/03/2026".',
      ].join('\n'),
    )
    return
  }

  const description = (intent.description ?? 'reembolso').trim()
  const category = mapIntentCategoryToApiCategory(intent.category)

  const pendingReimbursement: PendingReimbursementData = {
    description,
    amountInReais: intent.amount,
    category,
    date,
  }

  await transitionToConfirmation(pendingReimbursement, context, reply)
}

// ---------------------------------------------------------------------------
// Step: field edit while awaiting confirmation
// ---------------------------------------------------------------------------

async function handleFieldEdit(
  intent: ParsedIntent,
  pendingData: PendingReimbursementData,
  context: IntentContext,
  reply: ReplyFunction,
): Promise<void> {
  const updated: PendingReimbursementData = { ...pendingData }

  if (intent.description) updated.description = intent.description.trim()
  if (intent.amount != null && intent.amount > 0) updated.amountInReais = intent.amount
  if (intent.category) updated.category = mapIntentCategoryToApiCategory(intent.category)

  if (intent.expenseDate) {
    const newDate = resolveExpenseDate(intent.expenseDate)
    if (newDate) updated.date = newDate
  }

  await transitionToConfirmation(updated, context, reply)
}

// ---------------------------------------------------------------------------
// Step: persist the confirmed reimbursement via API
// ---------------------------------------------------------------------------

async function persistReimbursement(
  pendingData: PendingReimbursementData,
  context: IntentContext,
  reply: ReplyFunction,
): Promise<void> {
  try {
    const apiResponse = await registerReimbursement({
      userId: context.userId,
      description: pendingData.description,
      amountInReais: pendingData.amountInReais,
      category: pendingData.category,
      date: pendingData.date,
    })

    await reply(
      [
        'Pronto! 💚',
        '',
        `Reembolso de ${formatCurrencyFromCents(Math.round(pendingData.amountInReais * 100))} de ${capitalizeFirst(pendingData.description)} registrado.`,
        `Hoje você já gastou ${formatCurrencyFromCents(apiResponse.today_spent)} e ainda tem ${formatCurrencyFromCents(apiResponse.month_balance)} no mês.`,
        `Seu valor mais seguro para hoje ficou em ${formatCurrencyFromCents(apiResponse.recommended_today)} 👍`,
      ].join('\n'),
    )
  } catch (error) {
    await reply(resolveApiErrorMessage(error, 'register_reimbursement'))
  }
}

// ---------------------------------------------------------------------------
// Transition helpers — set session state and send interactive messages
// ---------------------------------------------------------------------------

async function transitionToConfirmation(
  pending: PendingReimbursementData,
  context: IntentContext,
  reply: ReplyFunction,
): Promise<void> {
  context.session.state = { intent: 'register_reimbursement', step: STEP_AWAITING_CONFIRMATION }
  context.session.operation = { type: 'register_reimbursement', data: pending as unknown as Record<string, unknown> }

  const confirmationText = buildReimbursementConfirmationText(pending)
  context.logResponse(confirmationText)

  await sendButtonMessage(context.phone, confirmationText, [
    { id: CONFIRM_BUTTON_ID, title: CONFIRM_BUTTON_TITLE },
  ])
}
