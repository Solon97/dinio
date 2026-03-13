import { IntentContext, ReplyFunction } from '../types'
import { handleStatusQuery } from './check-status-query.handler'

export async function handleCheckTodaySpending(
  context: IntentContext,
  reply: ReplyFunction,
): Promise<void> {
  await handleStatusQuery('check_today_spending', context, reply)
}
