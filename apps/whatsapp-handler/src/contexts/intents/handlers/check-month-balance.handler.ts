import { IntentContext, ReplyFunction } from '../types'
import { handleStatusQuery } from './check-status-query.handler'

export async function handleCheckMonthBalance(
  context: IntentContext,
  reply: ReplyFunction,
): Promise<void> {
  await handleStatusQuery('check_month_balance', context, reply)
}
