import { BotAgendaItem, getAgenda } from '../../dinio/dinio-api-client'
import { formatCurrencyFromCents } from '../../responses/formatters'
import { IntentContext, ReplyFunction } from '../types'
import { resolveApiErrorMessage } from './helpers'

const WEEKDAY_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function formatWeekDay(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  const weekday = new Date(y, m - 1, d).getDay()
  return `${WEEKDAY_PT[weekday]} ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`
}

function formatItemLine(item: BotAgendaItem, datePrefix?: string): string {
  const amountStr =
    item.amountCents !== null ? ` — ${formatCurrencyFromCents(item.amountCents)}` : ''
  const prefix = datePrefix ? `${datePrefix} — ` : ''
  return `• ${prefix}${item.name}${amountStr}`
}

function buildItemList(
  items: BotAgendaItem[],
  dateFormatter?: (date: string) => string,
): { lines: string; remaining: number } {
  const displayed = items.slice(0, 5)
  const remaining = items.length - displayed.length

  const lines = displayed
    .map((item) => {
      const datePrefix = dateFormatter && item.date ? dateFormatter(item.date) : undefined
      return formatItemLine(item, datePrefix)
    })
    .join('\n')

  return { lines, remaining }
}

export function buildAgendaMessage(items: BotAgendaItem[]): string {
  if (items.length === 0) {
    return [
      'Nenhum compromisso financeiro para hoje 😊',
      '',
      'Aproveite o dia sem preocupações com vencimentos!',
    ].join('\n')
  }

  const count = items.length
  const label = count === 1 ? 'compromisso' : 'compromissos'
  const { lines, remaining } = buildItemList(items)
  const suffix = remaining > 0 ? `\n+ ${remaining} outro${remaining > 1 ? 's' : ''}` : ''

  return [
    `Você tem ${count} ${label} para hoje 📅`,
    '',
    lines + suffix,
    '',
    'Fique de olho para não atrasar nenhum pagamento 👍',
  ].join('\n')
}

export function buildWeekAgendaMessage(items: BotAgendaItem[]): string {
  if (items.length === 0) {
    return [
      'Nenhum compromisso financeiro nesta semana 😊',
      '',
      'Aproveite a semana sem preocupações com vencimentos!',
    ].join('\n')
  }

  const count = items.length
  const label = count === 1 ? 'compromisso' : 'compromissos'
  const { lines, remaining } = buildItemList(items, formatWeekDay)
  const suffix = remaining > 0 ? `\n+ ${remaining} outro${remaining > 1 ? 's' : ''}` : ''

  return [
    `Você tem ${count} ${label} nesta semana 📅`,
    '',
    lines + suffix,
    '',
    'Fique de olho para não atrasar nenhum pagamento 👍',
  ].join('\n')
}

export function buildMonthAgendaMessage(items: BotAgendaItem[]): string {
  if (items.length === 0) {
    return [
      'Nenhum compromisso financeiro este mês 😊',
      '',
      'Aproveite o mês sem preocupações com vencimentos!',
    ].join('\n')
  }

  const count = items.length
  const label = count === 1 ? 'compromisso' : 'compromissos'
  const { lines, remaining } = buildItemList(items, (date) => {
    const day = parseInt(date.split('-')[2])
    return `Dia ${day}`
  })
  const suffix = remaining > 0 ? `\n+ ${remaining} outro${remaining > 1 ? 's' : ''}` : ''

  return [
    `Você tem ${count} ${label} este mês 📅`,
    '',
    lines + suffix,
    '',
    'Fique de olho para não atrasar nenhum pagamento 👍',
  ].join('\n')
}

function buildOverdueAlert(items: BotAgendaItem[]): string | null {
  if (items.length === 0) return null
  const count = items.length
  const label = count === 1 ? 'compromisso em atraso' : 'compromissos em atraso'
  const lines = items
    .map((item) => {
      const day = item.date ? parseInt(item.date.split('-')[2]) : null
      const dayStr = day ? ` (venceu dia ${day})` : ''
      const amountStr = item.amountCents !== null ? ` — ${formatCurrencyFromCents(item.amountCents)}` : ''
      return `• ${item.name}${amountStr}${dayStr}`
    })
    .join('\n')
  return [`⚠️ Você tem ${count} ${label}:`, '', lines].join('\n')
}

async function fetchOverdueAlert(userId: string): Promise<string | null> {
  try {
    const overdue = await getAgenda(userId, undefined, 'overdue')
    return buildOverdueAlert(overdue.items)
  } catch {
    return null
  }
}

function joinWithAlert(alert: string | null, message: string): string {
  return alert ? `${alert}\n\n${message}` : message
}

export async function handleCheckAgenda(context: IntentContext, reply: ReplyFunction): Promise<void> {
  try {
    const [agenda, alert] = await Promise.all([
      getAgenda(context.userId),
      fetchOverdueAlert(context.userId),
    ])
    await reply(joinWithAlert(alert, buildAgendaMessage(agenda.items)))
  } catch (error) {
    await reply(resolveApiErrorMessage(error, 'status'))
  }
}

export async function handleCheckAgendaWeek(
  context: IntentContext,
  reply: ReplyFunction,
): Promise<void> {
  try {
    const [agenda, alert] = await Promise.all([
      getAgenda(context.userId, undefined, 'week'),
      fetchOverdueAlert(context.userId),
    ])
    await reply(joinWithAlert(alert, buildWeekAgendaMessage(agenda.items)))
  } catch (error) {
    await reply(resolveApiErrorMessage(error, 'status'))
  }
}

export function buildOverdueMessage(items: BotAgendaItem[]): string {
  if (items.length === 0) {
    return [
      'Nenhum compromisso em atraso 🎉',
      '',
      'Seus vencimentos estão todos em dia!',
    ].join('\n')
  }

  const count = items.length
  const label = count === 1 ? 'compromisso em atraso' : 'compromissos em atraso'
  const lines = items
    .map((item) => {
      const day = item.date ? parseInt(item.date.split('-')[2]) : null
      const dayStr = day ? ` (venceu dia ${day})` : ''
      const amountStr = item.amountCents !== null ? ` — ${formatCurrencyFromCents(item.amountCents)}` : ''
      return `• ${item.name}${amountStr}${dayStr}`
    })
    .join('\n')

  return [
    `⚠️ Você tem ${count} ${label}:`,
    '',
    lines,
    '',
    'Regularize o quanto antes para evitar juros e multas.',
  ].join('\n')
}

export async function handleCheckAgendaOverdue(
  context: IntentContext,
  reply: ReplyFunction,
): Promise<void> {
  try {
    const agenda = await getAgenda(context.userId, undefined, 'overdue')
    await reply(buildOverdueMessage(agenda.items))
  } catch (error) {
    await reply(resolveApiErrorMessage(error, 'status'))
  }
}

export async function handleCheckAgendaMonth(
  context: IntentContext,
  reply: ReplyFunction,
): Promise<void> {
  try {
    const [agenda, alert] = await Promise.all([
      getAgenda(context.userId, undefined, 'month'),
      fetchOverdueAlert(context.userId),
    ])
    await reply(joinWithAlert(alert, buildMonthAgendaMessage(agenda.items)))
  } catch (error) {
    await reply(resolveApiErrorMessage(error, 'status'))
  }
}
