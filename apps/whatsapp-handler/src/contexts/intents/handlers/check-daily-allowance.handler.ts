import { IntentContext, ReplyFunction } from '../types'
import { handleStatusQuery } from './check-status-query.handler'

export async function handleCheckDailyAllowance(
  context: IntentContext,
  reply: ReplyFunction,
): Promise<void> {
  await handleStatusQuery('check_daily_allowance', context, reply)
}
