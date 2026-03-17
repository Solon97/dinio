import { z } from 'zod'
import { callAI } from './openrouter-client'
import { ParsedIntent } from '../intents/types'
import {
  type IntentDetectionContext,
  formatContextForPrompt,
} from '../session/contextBuilder'

const PROMPT_FILE = 'whatsapp-intent-parser.txt'

const SingleIntentSchema = z.object({
  intent: z.enum([
    'register_expense',
    'simulate_expense',
    'check_daily_allowance',
    'check_month_balance',
    'check_today_spending',
    'check_agenda',
    'check_agenda_week',
    'check_agenda_month',
    'check_agenda_overdue',
    'answer_from_history',
    'unknown',
  ]),
  description: z.string().nullable(),
  amount: z.number().nullable(),
  category: z.string().nullable(),
  answer: z.string().nullable(),
  expenseDate: z.string().nullable().optional().transform((v) => v ?? null),
  paymentType: z.enum(['debito', 'credito']).nullable().optional().transform((v) => v ?? null),
  cardNameMention: z.string().nullable().optional().transform((v) => v ?? null),
  isRefund: z.boolean().nullable().optional().transform((v) => v ?? null),
})

const ParsedIntentArraySchema = z.object({
  operations: z.array(SingleIntentSchema).min(1).max(10),
})

const FALLBACK_INTENTS: ParsedIntent[] = [
  {
    intent: 'unknown',
    description: null,
    amount: null,
    category: null,
    answer: null,
    expenseDate: null,
    paymentType: null,
    cardNameMention: null,
    isRefund: null,
  },
]

/**
 * Detects the user's intent(s) from the full conversation context.
 *
 * A single message may contain multiple financial operations (e.g.
 * "uber 28, pizza 45, mercado 120"). In that case the LLM returns all
 * operations and this function returns an array with one element per
 * detected operation.
 *
 * The LLM receives both the recent history window and the current message,
 * allowing it to resolve ambiguous follow-up messages (e.g. a bare number
 * sent after asking "how much do you want to spend?").
 *
 * Falls back to `[unknown]` on any error so the flow is never blocked.
 */
export async function parseIntent(
  context: IntentDetectionContext,
): Promise<ParsedIntent[]> {
  try {
    const formattedInput = formatContextForPrompt(context)
    const raw = await callAI(formattedInput, PROMPT_FILE)
    const parsed = ParsedIntentArraySchema.parse(JSON.parse(raw))
    return parsed.operations
  } catch (error) {
    console.error('Error parsing intent:', error)
    return FALLBACK_INTENTS
  }
}
