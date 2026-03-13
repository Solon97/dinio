import { computeInvoiceDueMonthIdForDate, formatMonthIdLabel } from 'dinio-shared'
import { DinioApiError } from '../../dinio/dinio-api-client'
import type { PendingCardInfo, PendingExpenseData } from '../../session/types'

// ---------------------------------------------------------------------------
// Category mapping
// ---------------------------------------------------------------------------

export function mapIntentCategoryToApiCategory(category: string | null): string {
  const normalized = normalizeText(category)

  switch (normalized) {
    case 'mercado':
      return 'Mercado'
    case 'restaurantes':
      return 'Restaurantes'
    case 'delivery':
      return 'Delivery'
    case 'alimentacao':
      return 'Restaurantes'
    case 'transporte':
      return 'Transporte'
    case 'lazer':
      return 'Lazer'
    case 'familia':
      return 'Família'
    case 'saude':
      return 'Saúde'
    case 'cuidados_pessoais':
    case 'cuidados pessoais':
      return 'Cuidados Pessoais'
    case 'presentes':
      return 'Presentes'
    case 'imprevistos':
      return 'Imprevistos'
    case 'moradia':
    case 'educacao':
    case 'vestuario':
    case 'outros':
      return 'Outros'
    default:
      return 'Outros'
  }
}

const CATEGORY_EMOJI: Record<string, string> = {
  Mercado: '🛒',
  Restaurantes: '🍽️',
  Delivery: '🛵',
  Transporte: '🚗',
  Lazer: '🎉',
  Família: '👪',
  Saúde: '❤️',
  'Cuidados Pessoais': '💇',
  Presentes: '🎁',
  Imprevistos: '🚨',
  Outros: '📦',
}

export function categoryWithEmoji(apiCategory: string): string {
  const emoji = CATEGORY_EMOJI[apiCategory] ?? '📦'
  return `${apiCategory} ${emoji}`
}

// ---------------------------------------------------------------------------
// Date resolution
// ---------------------------------------------------------------------------

const SAO_PAULO_TZ = 'America/Sao_Paulo'

function getTodayInSaoPaulo(): Date {
  const nowUtc = new Date()
  const tzDate = new Date(nowUtc.toLocaleString('en-US', { timeZone: SAO_PAULO_TZ }))
  return tzDate
}

function formatIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Converts an LLM-returned expenseDate value into an ISO date string (YYYY-MM-DD).
 * Accepts "hoje", "ontem", "amanhã", ISO strings, or null (defaults to today).
 * Returns `null` when the value is not parseable (handler should ask the user).
 */
export function resolveExpenseDate(expenseDate: string | null): string | null {
  const today = getTodayInSaoPaulo()

  if (!expenseDate || expenseDate === 'hoje') {
    return formatIsoDate(today)
  }

  if (expenseDate === 'ontem') {
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    return formatIsoDate(yesterday)
  }

  if (expenseDate === 'amanhã' || expenseDate === 'amanha') {
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    return formatIsoDate(tomorrow)
  }

  // Validate ISO format
  if (/^\d{4}-\d{2}-\d{2}$/.test(expenseDate)) {
    const [year, month, day] = expenseDate.split('-').map(Number)
    const parsed = new Date(year, month - 1, day)
    if (
      parsed.getFullYear() === year &&
      parsed.getMonth() === month - 1 &&
      parsed.getDate() === day
    ) {
      return expenseDate
    }
  }

  return null
}

/** Formats an ISO date as DD/MM/YYYY for display in messages. */
export function formatDateForDisplay(isoDate: string): string {
  const [year, month, day] = isoDate.split('-')
  return `${day}/${month}/${year}`
}

// ---------------------------------------------------------------------------
// Payment type inference
// ---------------------------------------------------------------------------

/**
 * Determines payment type from intent fields.
 * Rule: if a card name is mentioned (even without explicit "crédito"), assume credit.
 */
export function inferPaymentType(
  paymentType: 'debito' | 'credito' | null,
  cardNameMention: string | null,
): 'debito' | 'credito' {
  if (paymentType) return paymentType
  if (cardNameMention) return 'credito'
  return 'debito'
}

// ---------------------------------------------------------------------------
// Card matching
// ---------------------------------------------------------------------------

/**
 * Attempts to match a user-mentioned card name against the list of active cards.
 * Matching is case-insensitive, accent-insensitive, and uses substring search
 * so "nubank" matches "Nubank Personal" and vice versa.
 *
 * Returns the matched card when exactly one candidate is found, or `null` when
 * there are zero or more than one matches (ambiguous).
 */
export function matchCardByName(
  cards: PendingCardInfo[],
  nameHint: string,
): PendingCardInfo | null {
  const hint = normalizeText(nameHint)
  if (!hint) return null

  const candidates = cards.filter((card) => {
    const cardName = normalizeText(card.name)
    return cardName.includes(hint) || hint.includes(cardName)
  })

  return candidates.length === 1 ? candidates[0] : null
}

// ---------------------------------------------------------------------------
// Invoice month computation
// ---------------------------------------------------------------------------

/**
 * Computes the invoice due month ID (YYYYMM integer) for a given card and
 * expense date string, applying the same invoice-cycle logic as the web app.
 *
 * Supports cards whose closing day can belong to the month before the due date
 * (for example: due day 7 with closing day 28).
 */
export function computeInvoiceDueMonthId(
  isoDate: string,
  dueDay: number,
  closingDay: number,
): number {
  const [yearStr, monthStr, dayStr] = isoDate.split('-')
  const year = parseInt(yearStr, 10)
  const month = parseInt(monthStr, 10) // 1-based
  const day = parseInt(dayStr, 10)

  const expenseDate = new Date(year, month - 1, day)

  return computeInvoiceDueMonthIdForDate({
    expenseDate,
    dueDay,
    closingDay,
  })
}

/** Formats a YYYYMM integer as a human-readable "Mês YYYY" string (in pt-BR). */
export function formatMonthIdForDisplay(monthId: number): string {
  return formatMonthIdLabel(monthId)
}

// ---------------------------------------------------------------------------
// Confirmation message
// ---------------------------------------------------------------------------

/**
 * Builds the multi-line confirmation text shown to the user before saving the
 * expense. This is the body of the WhatsApp button message.
 */
export function buildConfirmationText(pending: PendingExpenseData): string {
  const amountFormatted = formatCurrencyBRL(pending.amountInReais)
  const dateFormatted = formatDateForDisplay(pending.date)
  const categoryDisplay = categoryWithEmoji(pending.category)
  const paymentLabel = pending.paymentType === 'credito' ? 'Crédito 💳' : 'Débito'

  const lines: string[] = [
    'Vou registrar esse gasto 📋',
    '',
    `📝 Nome: ${capitalizeFirst(pending.description)}`,
    `💰 Valor: ${amountFormatted}`,
    `🗂️ Categoria: ${categoryDisplay}`,
    `📅 Data: ${dateFormatted}`,
    `💳 Pagamento: ${paymentLabel}`,
  ]

  if (pending.paymentType === 'credito' && pending.card) {
    lines.push(`🏦 Cartão: ${pending.card.name}`)
  }

  if (pending.invoiceDueMonthId) {
    lines.push(`🗓️ Fatura: ${formatMonthIdForDisplay(pending.invoiceDueMonthId)}`)
  }

  lines.push('', 'Tudo certo? Confirme abaixo 👇')

  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Error resolution
// ---------------------------------------------------------------------------

export function resolveApiErrorMessage(error: unknown, operation: 'register' | 'status' | 'simulate'): string {
  if (error instanceof DinioApiError) {
    if (error.code === 'LAST_DAY_OF_MONTH') {
      return [
        'Hoje é o último dia do mês, então pode se guiar pela média recomendada para o dia',
        '',
        'Amanhã começa um novo mês — configure o orçamento no app do Dinio e pode voltar aqui para acompanhar seus gastos 👍',
      ].join('\n')
    }

    if (error.code === 'WHATSAPP_NOT_LINKED') {
      return [
        'Seu WhatsApp ainda não está conectado ao Dinio ⚠️',
        '',
        'Abra o app do Dinio e finalize a conexão. Assim que terminar, pode voltar aqui que eu continuo com você 👍',
      ].join('\n')
    }

    if (error.statusCode === 404) {
      return [
        'Ainda não encontrei seu mês configurado no Dinio 📅',
        '',
        'Abra o app e finalize a configuração do mês. Depois é só voltar aqui que eu te ajudo com os gastos 👍',
      ].join('\n')
    }
  }

  if (operation === 'register') {
    return ['Não consegui registrar esse gasto agora 💸', '', 'Tenta de novo daqui a pouquinho.'].join('\n')
  }

  return ['Não consegui consultar agora 📊', '', 'Tenta de novo daqui a pouco.'].join('\n')
}

// ---------------------------------------------------------------------------
// Text formatting
// ---------------------------------------------------------------------------

export function capitalizeFirst(value: string): string {
  if (!value) return value
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function formatCurrencyBRL(amountInReais: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(amountInReais)
}

// ---------------------------------------------------------------------------
// Internal utilities
// ---------------------------------------------------------------------------

function normalizeText(value: string | null | undefined): string {
  if (!value) return ''
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}
