import { BotAgendaItem, getAgenda } from '../../dinio/dinio-api-client'
import { formatCurrencyFromCents } from '../../responses/formatters'
import { IntentContext, ReplyFunction } from '../types'
import { resolveApiErrorMessage } from './helpers'

function buildAgendaMessage(items: BotAgendaItem[]): string {
  if (items.length === 0) {
    return [
      'Nenhum compromisso financeiro para hoje 😊',
      '',
      'Aproveite o dia sem preocupações com vencimentos!',
    ].join('\n')
  }

  const count = items.length
  const label = count === 1 ? 'compromisso' : 'compromissos'

  const displayed = items.slice(0, 5)
  const remaining = count - displayed.length

  const itemLines = displayed
    .map((item) => {
      const amountStr =
        item.amountCents !== null ? ` — ${formatCurrencyFromCents(item.amountCents)}` : ''
      return `• ${item.name}${amountStr}`
    })
    .join('\n')

  const suffix = remaining > 0 ? `\n+ ${remaining} outro${remaining > 1 ? 's' : ''}` : ''

  return [
    `Você tem ${count} ${label} para hoje 📅`,
    '',
    itemLines + suffix,
    '',
    'Fique de olho para não atrasar nenhum pagamento 👍',
  ].join('\n')
}

export async function handleCheckAgenda(context: IntentContext, reply: ReplyFunction): Promise<void> {
  try {
    const agenda = await getAgenda(context.userId)
    await reply(buildAgendaMessage(agenda.items))
  } catch (error) {
    await reply(resolveApiErrorMessage(error, 'status'))
  }
}

export { buildAgendaMessage }
