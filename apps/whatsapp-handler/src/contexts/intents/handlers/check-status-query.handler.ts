import { BotStatusResponse, getStatus } from '../../dinio/dinio-api-client'
import { formatCurrencyFromCents } from '../../responses/formatters'
import { IntentContext, ReplyFunction } from '../types'
import { resolveApiErrorMessage } from './helpers'

export type StatusQueryType =
  | 'check_daily_allowance'
  | 'check_month_balance'
  | 'check_today_spending'

function buildRecommendationLines(status: BotStatusResponse): string[] {
  if (status.month_balance <= 0) {
    return [
      'Seu limite de gastos planejado para o mês já foi atingido.',
      'Para fechar o mês com mais tranquilidade, o melhor é evitar novos gastos hoje.',
    ]
  }

  if (status.today_spent > status.recommended_today) {
    return [
      `Hoje a recomendação era ${formatCurrencyFromCents(status.recommended_today)}.`,
      'Sem problema: dá para ajustar os próximos dias com calma.',
    ]
  }

  return [
    `O ideal seria gastar até ${formatCurrencyFromCents(status.recommended_today)} hoje.`,
    'Assim o mês segue no controle.',
  ]
}

function buildStatusMessage(type: StatusQueryType, status: BotStatusResponse): string {
  const recommendationLines = buildRecommendationLines(status)

  switch (type) {
    case 'check_daily_allowance':
      return [
        ...recommendationLines,
        '',
        `Você já gastou ${formatCurrencyFromCents(status.today_spent)} hoje e ainda tem ${formatCurrencyFromCents(status.month_balance)} no mês.`,
      ].join('\n')
    case 'check_month_balance':
      return [
        `Você ainda tem ${formatCurrencyFromCents(status.month_balance)} no mês 📅`,
        '',
        ...recommendationLines,
        `Até agora você já gastou ${formatCurrencyFromCents(status.today_spent)}.`,
      ].join('\n')
    case 'check_today_spending':
      return [
        `Você gastou ${formatCurrencyFromCents(status.today_spent)} 💸`,
        '',
        ...recommendationLines,
        '',
        `Seu saldo no mês está em ${formatCurrencyFromCents(status.month_balance)}.`,
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
