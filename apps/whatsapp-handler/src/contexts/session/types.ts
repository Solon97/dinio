/** Maximum number of messages retained in the sliding history window. */
export const MAX_HISTORY_SIZE = 15

/** Session TTL in seconds (24 hours). */
export const SESSION_TTL_SECONDS = 24 * 60 * 60

/** A single entry in the conversation history window. */
export interface HistoryMessage {
  /** Raw message text. */
  text: string
  /** Unix timestamp (ms). Stored as compact field name `ts` to reduce payload size. */
  ts: number
}

/**
 * Represents the active step inside a multi-turn operation.
 * Cleared once the operation completes or is abandoned.
 */
export interface ConversationState {
  intent: string
  step: string
}

/**
 * Stores partial structured data accumulated during a multi-step operation.
 * Cleared once the operation completes or is abandoned.
 */
export interface OperationContext {
  type: string
  data: Record<string, unknown>
}

/** Minimal credit card info stored inside a pending expense operation. */
export interface PendingCardInfo {
  id: string
  name: string
  dueDay: number
  closingDay: number
}

/**
 * Typed payload stored inside `OperationContext.data` while a register_expense
 * multi-turn flow is in progress.
 */
export interface PendingExpenseData {
  description: string
  amountInReais: number
  category: string
  /** ISO date string YYYY-MM-DD resolved for the expense. */
  date: string
  paymentType: 'debito' | 'credito'
  /** Resolved card when paymentType is 'credito' and a match was found. */
  card?: PendingCardInfo
  /** YYYYMM integer computed from card + expense date. */
  invoiceDueMonthId?: number
  /**
   * All user cards fetched during this flow, stored for the interactive list
   * so the handler can resolve a selection by ID without an extra API call.
   */
  availableCards?: PendingCardInfo[]
  /** True when this entry is a refund (amount will be sent as negative to the API). */
  isRefund?: boolean
}

/**
 * The full session blob encrypted and stored in Redis under
 * `chat:session:{phone_hash}`.
 */
export interface ChatSession {
  /** Sliding window of recent messages. */
  history: HistoryMessage[]
  /** Current multi-step operation state, or null when idle. */
  state: ConversationState | null
  /** Partial data for the active operation, or null when idle. */
  operation: OperationContext | null
  /** Unix timestamp (ms) of the last interaction. Used for TTL bookkeeping. */
  lastInteraction: number
}
