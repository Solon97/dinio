import { ParsedIntent, IntentContext, ReplyFunction } from './types'
import { handleRegisterExpense } from './handlers/register-expense.handler'
import { handleRegisterMultipleExpenses } from './handlers/register-multiple-expenses.handler'
import { handleSimulateExpense } from './handlers/simulate-expense.handler'
import { handleCheckDailyAllowance } from './handlers/check-daily-allowance.handler'
import { handleCheckMonthBalance } from './handlers/check-month-balance.handler'
import { handleCheckTodaySpending } from './handlers/check-today-spending.handler'
import { handleCheckAgenda, handleCheckAgendaWeek, handleCheckAgendaMonth, handleCheckAgendaOverdue } from './handlers/check-agenda.handler'
import { handleAnswerFromHistory } from './handlers/answer-from-history.handler'
import { handleUnknown } from './handlers/unknown.handler'

/**
 * Dispatches one or more detected intents to the appropriate handler(s).
 *
 * When a single intent is received the existing per-intent handlers are used
 * unchanged (including multi-turn confirmation flows for register_expense).
 *
 * When multiple intents are received and they are all `register_expense`, the
 * bulk handler is invoked — which registers all expenses immediately without
 * per-expense confirmation, then shows a combined summary.
 *
 * For any other combination of multiple intents only the first intent is
 * processed, as mixing heterogeneous operations in one message is uncommon.
 */
export async function dispatchIntent(
  intents: ParsedIntent[],
  context: IntentContext,
  reply: ReplyFunction,
): Promise<void> {
  // Multiple intents where all are register_expense → bulk handler
  if (
    intents.length > 1 &&
    intents.every((i) => i.intent === 'register_expense')
  ) {
    return handleRegisterMultipleExpenses(intents, context, reply)
  }

  // Single intent or mixed multi-intent: dispatch the first intent normally
  const intent = intents[0]
  return dispatchSingle(intent, context, reply)
}

async function dispatchSingle(
  intent: ParsedIntent,
  context: IntentContext,
  reply: ReplyFunction,
): Promise<void> {
  switch (intent.intent) {
    case 'register_expense':
      return handleRegisterExpense(intent, context, reply)
    case 'simulate_expense':
      return handleSimulateExpense(intent, context, reply)
    case 'check_daily_allowance':
      return handleCheckDailyAllowance(context, reply)
    case 'check_month_balance':
      return handleCheckMonthBalance(context, reply)
    case 'check_today_spending':
      return handleCheckTodaySpending(context, reply)
    case 'check_agenda':
      return handleCheckAgenda(context, reply)
    case 'check_agenda_week':
      return handleCheckAgendaWeek(context, reply)
    case 'check_agenda_month':
      return handleCheckAgendaMonth(context, reply)
    case 'check_agenda_overdue':
      return handleCheckAgendaOverdue(context, reply)
    case 'answer_from_history':
      return handleAnswerFromHistory(intent, reply)
    case 'unknown':
    default:
      return handleUnknown(reply)
  }
}
