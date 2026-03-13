import type {
  ChatSession,
  ConversationState,
  HistoryMessage,
  OperationContext,
} from './types'

/**
 * The full context passed to the intent detection LLM.
 *
 * Assembles the sliding history window, the current multi-step state (if any),
 * the partial operation data (if any), and the incoming user message.
 *
 * Used exclusively for intent detection — never for summarisation or
 * memory rewriting. All memory management is deterministic.
 */
export interface IntentDetectionContext {
  /** Recent conversation history (up to MAX_HISTORY_SIZE messages). */
  history: HistoryMessage[]
  /** Current step in a multi-turn operation, or null when the user is idle. */
  state: ConversationState | null
  /** Partial structured data accumulated so far, or null when the user is idle. */
  operation: OperationContext | null
  /** The new message from the user that triggered this detection cycle. */
  currentMessage: string
}

/**
 * Builds the context object consumed by the intent detection LLM.
 *
 * This is the single construction point for `IntentDetectionContext` —
 * keep all other memory operations out of the AI layer.
 */
export function buildIntentContext(
  session: ChatSession,
  userMessage: string,
): IntentDetectionContext {
  return {
    history: session.history,
    state: session.state,
    operation: session.operation,
    currentMessage: userMessage,
  }
}

/**
 * Serialises an `IntentDetectionContext` into a formatted string suitable
 * for injection into an LLM prompt.
 *
 * Format (Portuguese, matching the app's user-facing language):
 *
 * ```
 * [Histórico da conversa]
 * user: ...
 * assistant: ...
 *
 * [Estado atual]
 * intent: simulate_expense | step: waiting_amount
 *
 * [Dados da operação]
 * {"type":"simulate_expense","data":{"amount":50}}
 *
 * [Mensagem atual]
 * quero gastar 50 reais no mercado
 * ```
 *
 * When there is no history or active state, those sections are omitted to
 * keep the prompt compact.
 */
export function formatContextForPrompt(ctx: IntentDetectionContext): string {
  const parts: string[] = []

  if (ctx.history.length > 0) {
    const historyLines = ctx.history
      .map((m) => `${m.role}: ${m.text}`)
      .join('\n')
    parts.push(`[Histórico da conversa]\n${historyLines}`)
  }

  if (ctx.state) {
    parts.push(
      `[Estado atual]\nintent: ${ctx.state.intent} | step: ${ctx.state.step}`,
    )
  }

  if (ctx.operation) {
    parts.push(`[Dados da operação]\n${JSON.stringify(ctx.operation)}`)
  }

  parts.push(`[Mensagem atual]\n${ctx.currentMessage}`)

  return parts.join('\n\n')
}
