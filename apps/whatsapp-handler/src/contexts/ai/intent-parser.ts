import { z } from 'zod'
import { callAI } from './openrouter-client'
import { ParsedIntent } from '../intents/types'
import {
  type IntentDetectionContext,
  formatContextForPrompt,
} from '../session/contextBuilder'

const PROMPT_FILE = 'whatsapp-intent-parser.txt'

const ParsedIntentSchema = z.object({
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
})

const FALLBACK_INTENT: ParsedIntent = {
  intent: 'unknown',
  description: null,
  amount: null,
  category: null,
  answer: null,
  expenseDate: null,
  paymentType: null,
  cardNameMention: null,
}

/**
 * Detects the user's intent from the full conversation context.
 *
 * The LLM receives both the recent history window and the current message,
 * allowing it to resolve ambiguous follow-up messages (e.g. a bare number
 * sent after asking "how much do you want to spend?").
 *
 * Falls back to `unknown` on any error so the flow is never blocked.
 */
export async function parseIntent(
  context: IntentDetectionContext,
): Promise<ParsedIntent> {
  try {
    const formattedInput = formatContextForPrompt(context)
    const raw = await callAI(formattedInput, PROMPT_FILE)
    const parsed = ParsedIntentSchema.parse(JSON.parse(raw))
    return parsed
  } catch (error) {
    console.error('Error parsing intent:', error)
    return FALLBACK_INTENT
  }
}
