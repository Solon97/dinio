export type IntentType =
  | 'register_expense'
  | 'simulate_expense'
  | 'check_daily_allowance'
  | 'check_month_balance'
  | 'check_today_spending'
  | 'check_agenda'
  | 'check_agenda_week'
  | 'check_agenda_month'
  | 'answer_from_history'
  | 'unknown'

export interface ParsedIntent {
  intent: IntentType
  description: string | null
  amount: number | null
  category: string | null
  /** Populated by the LLM when intent is `answer_from_history`. */
  answer: string | null
  /**
   * Expense date as returned by the LLM: ISO string (YYYY-MM-DD), or one of
   * the natural-language tokens "hoje", "ontem", "amanhã". Null when the
   * user did not mention a date (defaults to today in the handler).
   */
  expenseDate: string | null
  /**
   * Payment method inferred from the message.
   * Null when not mentioned (handler defaults to "debito" unless a card is
   * mentioned, in which case it defaults to "credito").
   */
  paymentType: 'debito' | 'credito' | null
  /**
   * Raw card name as mentioned in the message (e.g. "nubank", "inter").
   * The handler normalises and matches it against the user's cards.
   */
  cardNameMention: string | null
}

export type ReplyFunction = (message: string) => Promise<void>

export interface IntentContext {
  userId: string
  /** Phone number of the user (E.164 format without the + prefix). */
  phone: string
  /**
   * Active session for the current user.
   * Handlers may set `session.state` and `session.operation` to initiate a
   * multi-turn flow. The message router persists the session after dispatch.
   */
  session: import('../session/types').ChatSession
  /**
   * Snapshot of the conversation state captured before the session was reset
   * for this turn. Use this to determine which step of a multi-turn flow the
   * user is currently in.
   */
  previousState: import('../session/types').ConversationState | null
  /**
   * Snapshot of the operation context captured before the session was reset
   * for this turn. Contains partial data accumulated in previous turns.
   */
  previousOperation: import('../session/types').OperationContext | null
  /**
   * Set when the incoming message is an interactive reply (button or list
   * selection). Contains the `id` value set when the interactive message was
   * sent, allowing the handler to identify the selection without LLM parsing.
   */
  interactiveReplyId: string | null
}
