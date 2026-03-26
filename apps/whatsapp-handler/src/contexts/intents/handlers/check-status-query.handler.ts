import { BotStatusResponse, getStatus } from '../../dinio/dinio-api-client'
import { formatCurrencyFromCents } from '../../responses/formatters'
import { IntentContext, ReplyFunction } from '../types'
import { resolveApiErrorMessage } from './helpers'

export type StatusQueryType =
  | 'check_daily_allowance'
  | 'check_month_balance'
  | 'check_today_spending'

function buildStatusMessage(type: StatusQueryType, status: BotStatusResponse): string {
  switch (type) {
    case 'check_daily_allowance':
      return [
        `Hoje você pode gastar até ${formatCurrencyFromCents(status.recommended_today)}. 💚`,
        `Você já gastou ${formatCurrencyFromCents(status.today_spent)} e ainda pode gastar ${formatCurrencyFromCents(status.month_balance)} no mês.`,
      ].join('\n')
    case 'check_month_balance':
      return [
        `Você ainda tem ${formatCurrencyFromCents(status.month_balance)} pra usar no mês.`,
        `Distribuindo pelos dias que faltam, o recomendado para hoje é ${formatCurrencyFromCents(status.recommended_today)} e você já gastou ${formatCurrencyFromCents(status.today_spent)}.`,
      ].join('\n')
    case 'check_today_spending':
      return [
        `Você gastou ${formatCurrencyFromCents(status.today_spent)} 💸`,
        '',
        `Seu saldo no mês está em ${formatCurrencyFromCents(status.month_balance)} e o recomendado para hoje é ${formatCurrencyFromCents(status.recommended_today)}.`,
      ].join('\n')
  }
}

export async function handleStatusQuery(
  type: StatusQueryType,
  context: IntentContext,
  reply: ReplyFunction,
): Promise<void> {
  try {
    const status = await getStatus(context.userId)

    await reply(buildStatusMessage(type, status))
  } catch (error) {
    await reply(resolveApiErrorMessage(error, 'status'))
  }
}
