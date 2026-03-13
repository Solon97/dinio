export interface BotStatusResponse {
  recommended_today: number
  today_spent: number
  month_balance: number
  days_left: number
  month_projection: number
}

export interface ResolveUserResponse {
  linked: boolean
  user_id?: string
  link?: string
}

export interface RegisterExpenseResponse {
  expense_saved: boolean
  today_spent: number
  recommended_today: number
  month_balance: number
}

export interface SimulateExpenseResponse {
  new_future_recommendation: number
  new_month_balance: number
  new_projection: number
}

export interface BotCreditCard {
  id: string
  name: string
  dueDay: number
  closingDay: number
}

export interface GetCreditCardsResponse {
  creditCards: BotCreditCard[]
}

interface ErrorBody {
  error?: string
  code?: string
}

export class DinioApiError extends Error {
  statusCode: number
  code?: string

  constructor(message: string, statusCode: number, code?: string) {
    super(message)
    this.name = 'DinioApiError'
    this.statusCode = statusCode
    this.code = code
  }
}

interface DinioConfig {
  baseUrl: string
  botInternalSecret: string
}

function getConfig(): DinioConfig {
  const baseUrl = process.env.DINIO_API_BASE_URL
  const botInternalSecret = process.env.DINIO_BOT_INTERNAL_SECRET

  if (!baseUrl || !botInternalSecret) {
    throw new Error('Missing required env vars: DINIO_API_BASE_URL and/or DINIO_BOT_INTERNAL_SECRET')
  }

  return {
    baseUrl: baseUrl.replace(/\/$/, ''),
    botInternalSecret,
  }
}

function toCents(amountInReais: number): number {
  return Math.round(amountInReais * 100)
}

async function parseErrorBody(response: Response): Promise<ErrorBody> {
  try {
    return (await response.json()) as ErrorBody
  } catch {
    return {}
  }
}

async function requestJson<T>(path: string, init: RequestInit): Promise<T> {
  const { baseUrl, botInternalSecret } = getConfig()

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'x-bot-secret': botInternalSecret,
      ...(init.headers ?? {}),
    },
  })

  if (!response.ok) {
    const body = await parseErrorBody(response)
    throw new DinioApiError(
      body.error ?? `Dinio API error ${response.status}`,
      response.status,
      body.code,
    )
  }

  return (await response.json()) as T
}

export async function resolveUserByPhone(phoneNumber: string): Promise<ResolveUserResponse> {
  return requestJson<ResolveUserResponse>('/api/bot/resolve-user', {
    method: 'POST',
    body: JSON.stringify({
      phone_number: phoneNumber,
    }),
  })
}

export async function getStatus(userId: string): Promise<BotStatusResponse> {
  const encodedUserId = encodeURIComponent(userId)
  return requestJson<BotStatusResponse>(`/api/bot/status?user_id=${encodedUserId}`, {
    method: 'GET',
  })
}

interface RegisterExpenseInput {
  userId: string
  description: string
  amountInReais: number
  category: string
  /** ISO date string YYYY-MM-DD. Defaults to today server-side when omitted. */
  date?: string
  creditCardId?: string
  invoiceDueMonthId?: number
}

export async function registerExpense(input: RegisterExpenseInput): Promise<RegisterExpenseResponse> {
  return requestJson<RegisterExpenseResponse>('/api/bot/register-expense', {
    method: 'POST',
    body: JSON.stringify({
      user_id: input.userId,
      description: input.description,
      amount: toCents(input.amountInReais),
      category: input.category,
      ...(input.date ? { date: input.date } : {}),
      ...(input.creditCardId ? { credit_card_id: input.creditCardId } : {}),
      ...(input.invoiceDueMonthId ? { invoice_due_month_id: input.invoiceDueMonthId } : {}),
    }),
  })
}

export async function getCreditCards(userId: string): Promise<BotCreditCard[]> {
  const encodedUserId = encodeURIComponent(userId)
  const result = await requestJson<GetCreditCardsResponse>(
    `/api/bot/credit-cards?user_id=${encodedUserId}`,
    { method: 'GET' },
  )
  return result.creditCards
}

interface SimulateExpenseInput {
  userId: string
  amountInReais: number
  description?: string
}

export async function simulateExpense(input: SimulateExpenseInput): Promise<SimulateExpenseResponse> {
  return requestJson<SimulateExpenseResponse>('/api/bot/simulate-expense', {
    method: 'POST',
    body: JSON.stringify({
      user_id: input.userId,
      amount: toCents(input.amountInReais),
      description: input.description,
    }),
  })
}
