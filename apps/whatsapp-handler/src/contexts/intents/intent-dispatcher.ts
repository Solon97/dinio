import { ParsedIntent, IntentContext, ReplyFunction } from './types'
import { handleRegisterExpense } from './handlers/register-expense.handler'
import { handleSimulateExpense } from './handlers/simulate-expense.handler'
import { handleCheckDailyAllowance } from './handlers/check-daily-allowance.handler'
import { handleCheckMonthBalance } from './handlers/check-month-balance.handler'
import { handleCheckTodaySpending } from './handlers/check-today-spending.handler'
import { handleCheckAgenda } from './handlers/check-agenda.handler'
import { handleAnswerFromHistory } from './handlers/answer-from-history.handler'
import { handleUnknown } from './handlers/unknown.handler'

export async function dispatchIntent(
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
    case 'answer_from_history':
      return handleAnswerFromHistory(intent, reply)
    case 'unknown':
    default:
      return handleUnknown(reply)
  }
}
