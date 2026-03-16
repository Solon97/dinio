import { after, before, beforeEach, describe, it, mock } from 'node:test'
import assert from 'node:assert'

import {
  buildConfirmationText,
  categoryWithEmoji,
  computeInvoiceDueMonthId,
  formatDateForDisplay,
  inferPaymentType,
  mapIntentCategoryToApiCategory,
  matchCardByName,
  resolveExpenseDate,
} from '../../src/contexts/intents/handlers/helpers'
import type { IntentContext, ParsedIntent, ReplyFunction } from '../../src/contexts/intents/types'
import type { ChatSession, PendingCardInfo, PendingExpenseData } from '../../src/contexts/session/types'

// ---------------------------------------------------------------------------
// Test factories
// ---------------------------------------------------------------------------

function makeSession(overrides: Partial<ChatSession> = {}): ChatSession {
  return {
    history: [],
    state: null,
    operation: null,
    lastInteraction: Date.now(),
    ...overrides,
  }
}

function makeContext(
  overrides: Partial<IntentContext> = {},
  session: ChatSession = makeSession(),
): IntentContext {
  return {
    userId: 'user-123',
    phone: '5511999999999',
    session,
    previousState: null,
    previousOperation: null,
    interactiveReplyId: null,
    ...overrides,
  }
}

function makeReply(): { fn: ReplyFunction; calls: string[] } {
  const calls: string[] = []
  const fn: ReplyFunction = async (text: string) => {
    calls.push(text)
  }
  return { fn, calls }
}

function makeIntent(overrides: Partial<ParsedIntent> = {}): ParsedIntent {
  return {
    intent: 'register_expense',
    description: null,
    amount: null,
    category: null,
    answer: null,
    expenseDate: null,
    paymentType: null,
    cardNameMention: null,
    ...overrides,
  }
}

const NUBANK_CARD: PendingCardInfo = {
  id: 'card-nubank',
  name: 'Nubank',
  dueDay: 10,
  closingDay: 3,
}

const ITAU_CARD: PendingCardInfo = {
  id: 'card-itau',
  name: 'Itaú Mastercard',
  dueDay: 15,
  closingDay: 8,
}

const DEFAULT_REGISTER_RESULT = {
  expense_saved: true,
  today_spent: 5000,
  recommended_today: 3000,
  month_balance: 100000,
}

// ---------------------------------------------------------------------------
// Pure helper function tests
// ---------------------------------------------------------------------------

describe('helpers', () => {
  describe('resolveExpenseDate', () => {
    it('returns a valid ISO date for null input (defaults to today)', () => {
      const result = resolveExpenseDate(null)
      assert.ok(result, 'should not return null for null input')
      assert.match(result!, /^\d{4}-\d{2}-\d{2}$/)
    })

    it('returns a valid ISO date for "hoje"', () => {
      const result = resolveExpenseDate('hoje')
      assert.ok(result)
      assert.match(result!, /^\d{4}-\d{2}-\d{2}$/)
    })

    it('resolves "ontem" to a date one day before hoje', () => {
      const hojeStr = resolveExpenseDate('hoje')!
      const ontemStr = resolveExpenseDate('ontem')!
      const hojeTs = new Date(hojeStr + 'T12:00:00').getTime()
      const ontemTs = new Date(ontemStr + 'T12:00:00').getTime()
      assert.ok(ontemTs < hojeTs, 'ontem must be before hoje')
      assert.strictEqual(hojeTs - ontemTs, 24 * 60 * 60 * 1000)
    })

    it('resolves "amanhã" to a date one day after hoje', () => {
      const hojeStr = resolveExpenseDate('hoje')!
      const amanhaStr = resolveExpenseDate('amanhã')!
      const hojeTs = new Date(hojeStr + 'T12:00:00').getTime()
      const amanhaTs = new Date(amanhaStr + 'T12:00:00').getTime()
      assert.ok(amanhaTs > hojeTs, 'amanhã must be after hoje')
      assert.strictEqual(amanhaTs - hojeTs, 24 * 60 * 60 * 1000)
    })

    it('passes through a valid ISO date string unchanged', () => {
      assert.strictEqual(resolveExpenseDate('2026-03-15'), '2026-03-15')
      assert.strictEqual(resolveExpenseDate('2025-12-31'), '2025-12-31')
    })

    it('returns null for an invalid ISO date (month out of range)', () => {
      assert.strictEqual(resolveExpenseDate('2026-13-01'), null)
    })

    it('returns null for a non-date string', () => {
      assert.strictEqual(resolveExpenseDate('próxima semana'), null)
    })
  })

  describe('formatDateForDisplay', () => {
    it('formats YYYY-MM-DD as DD/MM/YYYY', () => {
      assert.strictEqual(formatDateForDisplay('2026-03-12'), '12/03/2026')
      assert.strictEqual(formatDateForDisplay('2025-01-05'), '05/01/2025')
    })
  })

  describe('inferPaymentType', () => {
    it('returns the explicit payment type when provided', () => {
      assert.strictEqual(inferPaymentType('debito', null), 'debito')
      assert.strictEqual(inferPaymentType('credito', null), 'credito')
      assert.strictEqual(inferPaymentType('credito', 'nubank'), 'credito')
    })

    it('defaults to "credito" when a card name is mentioned', () => {
      assert.strictEqual(inferPaymentType(null, 'nubank'), 'credito')
      assert.strictEqual(inferPaymentType(null, 'inter'), 'credito')
    })

    it('defaults to "debito" when neither payment type nor card name is provided', () => {
      assert.strictEqual(inferPaymentType(null, null), 'debito')
    })
  })

  describe('matchCardByName', () => {
    const cards: PendingCardInfo[] = [NUBANK_CARD, ITAU_CARD]

    it('returns the card for a single exact match (case-insensitive)', () => {
      const result = matchCardByName(cards, 'nubank')
      assert.strictEqual(result?.id, 'card-nubank')
    })

    it('returns the card for a partial match', () => {
      const result = matchCardByName(cards, 'itaú')
      assert.strictEqual(result?.id, 'card-itau')
    })

    it('returns null when no card matches the hint', () => {
      assert.strictEqual(matchCardByName(cards, 'bradesco'), null)
    })

    it('returns null for an empty hint', () => {
      assert.strictEqual(matchCardByName(cards, ''), null)
    })

    it('returns null when multiple cards match the same hint (ambiguous)', () => {
      const ambiguousCards: PendingCardInfo[] = [
        { id: 'card-1', name: 'Nubank Purple', dueDay: 10, closingDay: 3 },
        { id: 'card-2', name: 'Nubank Ultraviolet', dueDay: 10, closingDay: 1 },
      ]
      const result = matchCardByName(ambiguousCards, 'nubank')
      assert.strictEqual(result, null)
    })
  })

  describe('computeInvoiceDueMonthId', () => {
    it('assigns to the current month when expense day is on or before the closing day', () => {
      // Closing day = 3, expense on March 3 → March invoice (202603)
      assert.strictEqual(computeInvoiceDueMonthId('2026-03-03', 10, 3), 202603)
    })

    it('assigns to next month when expense day is after the closing day', () => {
      // Closing day = 3, expense on March 4 → April invoice (202604)
      assert.strictEqual(computeInvoiceDueMonthId('2026-03-04', 10, 3), 202604)
    })

    it('assigns to next month when expense is in December (year rollover)', () => {
      // Closing day = 3, expense on December 15 → January next year (202701)
      assert.strictEqual(computeInvoiceDueMonthId('2026-12-15', 10, 3), 202701)
    })

    it('stays in the same month for a December expense before closing day', () => {
      // Closing day = 20, expense on December 15 → December invoice (202612)
      assert.strictEqual(computeInvoiceDueMonthId('2026-12-15', 27, 20), 202612)
    })

    it('handles previous-month closing for early-month purchases', () => {
      // Due day = 7, closing day = 28 (previous month).
      // Purchase on March 5 belongs to April due month.
      assert.strictEqual(computeInvoiceDueMonthId('2026-03-05', 7, 28), 202604)
    })

    it('can assign to month+2 when purchase happens right after previous-month closing', () => {
      // Due day = 7, closing day = 28 (previous month).
      // Purchase on March 29 misses April invoice and goes to May.
      assert.strictEqual(computeInvoiceDueMonthId('2026-03-29', 7, 28), 202605)
    })

    it('handles year rollover for month+2 assignment with previous-month closing', () => {
      // Purchase on December 29 with closing day 28 and due day 7 goes to February next year.
      assert.strictEqual(computeInvoiceDueMonthId('2026-12-29', 7, 28), 202702)
    })
  })

  describe('mapIntentCategoryToApiCategory', () => {
    it('maps all known LLM category tokens to API values', () => {
      assert.strictEqual(mapIntentCategoryToApiCategory('mercado'), 'Mercado')
      assert.strictEqual(mapIntentCategoryToApiCategory('restaurantes'), 'Restaurantes')
      assert.strictEqual(mapIntentCategoryToApiCategory('delivery'), 'Delivery')
      assert.strictEqual(mapIntentCategoryToApiCategory('transporte'), 'Transporte')
      assert.strictEqual(mapIntentCategoryToApiCategory('lazer'), 'Lazer')
      assert.strictEqual(mapIntentCategoryToApiCategory('familia'), 'Família')
      assert.strictEqual(mapIntentCategoryToApiCategory('saude'), 'Saúde')
      assert.strictEqual(mapIntentCategoryToApiCategory('cuidados_pessoais'), 'Cuidados Pessoais')
      assert.strictEqual(mapIntentCategoryToApiCategory('presentes'), 'Presentes')
      assert.strictEqual(mapIntentCategoryToApiCategory('imprevistos'), 'Imprevistos')
      assert.strictEqual(mapIntentCategoryToApiCategory('outros'), 'Outros')
    })

    it('maps legacy tokens (not in LLM prompt) to Outros', () => {
      assert.strictEqual(mapIntentCategoryToApiCategory('moradia'), 'Outros')
      assert.strictEqual(mapIntentCategoryToApiCategory('educacao'), 'Outros')
      assert.strictEqual(mapIntentCategoryToApiCategory('vestuario'), 'Outros')
    })

    it('defaults to Outros for null or unrecognised input', () => {
      assert.strictEqual(mapIntentCategoryToApiCategory(null), 'Outros')
      assert.strictEqual(mapIntentCategoryToApiCategory('xyzzy'), 'Outros')
    })
  })

  describe('categoryWithEmoji', () => {
    it('appends the correct emoji for known categories', () => {
      assert.ok(categoryWithEmoji('Transporte').includes('🚗'))
      assert.ok(categoryWithEmoji('Mercado').includes('🛒'))
      assert.ok(categoryWithEmoji('Saúde').includes('❤️'))
    })

    it('appends the fallback emoji for unknown categories', () => {
      const result = categoryWithEmoji('Desconhecido')
      assert.ok(result.includes('📦'))
    })
  })

  describe('buildConfirmationText', () => {
    it('includes all required fields for a debit expense', () => {
      const pending: PendingExpenseData = {
        description: 'uber',
        amountInReais: 28,
        category: 'Transporte',
        date: '2026-03-12',
        paymentType: 'debito',
      }

      const text = buildConfirmationText(pending)

      assert.ok(text.includes('Uber'), 'should capitalize description')
      assert.ok(text.includes('28'), 'should show amount')
      assert.ok(text.includes('Transporte'), 'should show category')
      assert.ok(text.includes('12/03/2026'), 'should format date as DD/MM/YYYY')
      assert.ok(text.includes('Débito'), 'should show payment type')
      assert.ok(!text.includes('Cartão'), 'should not include card section for debit')
      assert.ok(!text.includes('Fatura'), 'should not include invoice section for debit')
    })

    it('includes card and invoice fields for a credit expense', () => {
      const pending: PendingExpenseData = {
        description: 'mercado',
        amountInReais: 120,
        category: 'Mercado',
        date: '2026-03-12',
        paymentType: 'credito',
        card: NUBANK_CARD,
        invoiceDueMonthId: 202604,
      }

      const text = buildConfirmationText(pending)

      assert.ok(text.includes('Nubank'), 'should show card name')
      assert.ok(text.includes('Crédito'), 'should show credit payment type')
      assert.ok(text.toLowerCase().includes('abril'), 'should show invoice month label')
    })

    it('omits card section when credit but card is not yet resolved', () => {
      const pending: PendingExpenseData = {
        description: 'compra',
        amountInReais: 50,
        category: 'Outros',
        date: '2026-03-12',
        paymentType: 'credito',
        // card intentionally absent
      }

      const text = buildConfirmationText(pending)
      assert.ok(!text.includes('Cartão:'), 'should not include card section without resolved card')
    })
  })
})

// ---------------------------------------------------------------------------
// handleRegisterExpense handler tests (with mocked external dependencies)
// ---------------------------------------------------------------------------

describe('handleRegisterExpense', () => {
  // Load the shared module exports objects. TypeScript compiles named imports as
  // `mod.fn()` property accesses on these objects, so patching them here is
  // sufficient to replace the handler's dependencies at call time.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const apiClientModule = require('../../src/contexts/dinio/dinio-api-client') as Record<string, unknown>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const whatsappClientModule = require('../../src/contexts/whatsapp/whatsapp-client') as Record<string, unknown>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { handleRegisterExpense } = require('../../src/contexts/intents/handlers/register-expense.handler') as typeof import('../../src/contexts/intents/handlers/register-expense.handler')

  // Preserve originals so they can be restored after all handler tests
  const originals = {
    getCreditCards: apiClientModule.getCreditCards,
    registerExpense: apiClientModule.registerExpense,
    sendButtonMessage: whatsappClientModule.sendButtonMessage,
    sendListMessage: whatsappClientModule.sendListMessage,
  }

  // Mutable state driving mock behaviour — reset in beforeEach
  let creditCardsToReturn: PendingCardInfo[] = []
  let throwOnGetCreditCards = false
  let throwOnRegisterExpense = false

  const getCreditCardsMock = mock.fn(async () => {
    if (throwOnGetCreditCards) throw new Error('API error')
    return creditCardsToReturn
  })

  const registerExpenseMock = mock.fn(async () => {
    if (throwOnRegisterExpense) throw new Error('API error')
    return { ...DEFAULT_REGISTER_RESULT }
  })

  const sendButtonMessageMock = mock.fn(async () => {})
  const sendListMessageMock = mock.fn(async () => {})

  before(() => {
    // Patch the shared exports objects that the handler references via mod.fn()
    apiClientModule.getCreditCards = getCreditCardsMock
    apiClientModule.registerExpense = registerExpenseMock
    whatsappClientModule.sendButtonMessage = sendButtonMessageMock
    whatsappClientModule.sendListMessage = sendListMessageMock
  })

  after(() => {
    // Restore originals to avoid affecting other test suites
    apiClientModule.getCreditCards = originals.getCreditCards
    apiClientModule.registerExpense = originals.registerExpense
    whatsappClientModule.sendButtonMessage = originals.sendButtonMessage
    whatsappClientModule.sendListMessage = originals.sendListMessage
  })

  beforeEach(() => {
    creditCardsToReturn = []
    throwOnGetCreditCards = false
    throwOnRegisterExpense = false

    getCreditCardsMock.mock.resetCalls()
    registerExpenseMock.mock.resetCalls()
    sendButtonMessageMock.mock.resetCalls()
    sendListMessageMock.mock.resetCalls()
  })

  // -------------------------------------------------------------------------
  // Starting a new expense flow
  // -------------------------------------------------------------------------

  it('replies asking for amount when none is provided', async () => {
    const session = makeSession()
    const context = makeContext({}, session)
    const { fn: reply, calls } = makeReply()

    await handleRegisterExpense(makeIntent({ description: 'uber' }), context, reply)

    assert.strictEqual(calls.length, 1)
    assert.ok(calls[0].includes('valor'), 'should tell user to provide the amount')
    assert.strictEqual(session.state, null, 'should not change session state')
    assert.strictEqual(sendButtonMessageMock.mock.callCount(), 0)
  })

  it('sends confirmation with button for a debit expense', async () => {
    const session = makeSession()
    const context = makeContext({}, session)
    const { fn: reply } = makeReply()

    await handleRegisterExpense(
      makeIntent({ description: 'uber', amount: 28, category: 'transporte', expenseDate: '2026-03-12' }),
      context,
      reply,
    )

    assert.strictEqual(sendButtonMessageMock.mock.callCount(), 1, 'should send button message')
    assert.strictEqual(sendListMessageMock.mock.callCount(), 0)
    assert.strictEqual(getCreditCardsMock.mock.callCount(), 0, 'should not fetch cards for debit')

    assert.strictEqual(session.state?.step, 'awaiting_confirmation')
    assert.strictEqual(session.state?.intent, 'register_expense')

    const savedExpense = session.operation?.data as unknown as PendingExpenseData
    assert.strictEqual(savedExpense.paymentType, 'debito')
    assert.strictEqual(savedExpense.amountInReais, 28)
    assert.strictEqual(savedExpense.description, 'uber')
    assert.strictEqual(savedExpense.date, '2026-03-12')
  })

  it('sends confirmation with card info when card name matches a user card', async () => {
    creditCardsToReturn = [NUBANK_CARD, ITAU_CARD]

    const session = makeSession()
    const context = makeContext({}, session)
    const { fn: reply } = makeReply()

    await handleRegisterExpense(
      makeIntent({
        description: 'mercado',
        amount: 120,
        category: 'mercado',
        expenseDate: '2026-03-12',
        paymentType: 'credito',
        cardNameMention: 'nubank',
      }),
      context,
      reply,
    )

    assert.strictEqual(getCreditCardsMock.mock.callCount(), 1, 'should fetch user cards')
    assert.strictEqual(sendButtonMessageMock.mock.callCount(), 1, 'should send confirmation button')
    assert.strictEqual(sendListMessageMock.mock.callCount(), 0, 'should not show card list')

    assert.strictEqual(session.state?.step, 'awaiting_confirmation')

    const savedExpense = session.operation?.data as unknown as PendingExpenseData
    assert.strictEqual(savedExpense.card?.id, 'card-nubank')
    // Nubank closingDay=3, expense on March 12 → after closing → April 2026
    assert.strictEqual(savedExpense.invoiceDueMonthId, 202604)
  })

  it('sends card selection list when no card name is provided for a credit expense', async () => {
    creditCardsToReturn = [NUBANK_CARD, ITAU_CARD]

    const session = makeSession()
    const context = makeContext({}, session)
    const { fn: reply } = makeReply()

    await handleRegisterExpense(
      makeIntent({ description: 'mercado', amount: 120, category: 'mercado', paymentType: 'credito' }),
      context,
      reply,
    )

    assert.strictEqual(sendListMessageMock.mock.callCount(), 1, 'should send card list')
    assert.strictEqual(sendButtonMessageMock.mock.callCount(), 0, 'should not send confirmation yet')

    assert.strictEqual(session.state?.step, 'card_selection_required')

    const savedExpense = session.operation?.data as unknown as PendingExpenseData
    assert.deepStrictEqual(
      savedExpense.availableCards?.map((c) => c.id),
      ['card-nubank', 'card-itau'],
    )
  })

  it('sends card selection list when the card name hint is ambiguous', async () => {
    const ambiguousCards: PendingCardInfo[] = [
      { id: 'card-1', name: 'Nubank Purple', dueDay: 10, closingDay: 3 },
      { id: 'card-2', name: 'Nubank Ultraviolet', dueDay: 10, closingDay: 1 },
    ]
    creditCardsToReturn = ambiguousCards

    const session = makeSession()
    const context = makeContext({}, session)
    const { fn: reply } = makeReply()

    await handleRegisterExpense(
      makeIntent({
        description: 'compra',
        amount: 50,
        paymentType: 'credito',
        cardNameMention: 'nubank',
      }),
      context,
      reply,
    )

    assert.strictEqual(sendListMessageMock.mock.callCount(), 1, 'should show list for ambiguous match')
    assert.strictEqual(session.state?.step, 'card_selection_required')
  })

  it('replies with guidance when user has no credit cards registered', async () => {
    creditCardsToReturn = [] // empty — no cards

    const session = makeSession()
    const context = makeContext({}, session)
    const { fn: reply, calls } = makeReply()

    await handleRegisterExpense(
      makeIntent({ description: 'compra', amount: 50, paymentType: 'credito' }),
      context,
      reply,
    )

    assert.strictEqual(calls.length, 1)
    assert.ok(calls[0].toLowerCase().includes('cartão') || calls[0].toLowerCase().includes('cartoes'))
    assert.strictEqual(session.state, null, 'should not start a flow without cards')
    assert.strictEqual(sendListMessageMock.mock.callCount(), 0)
  })

  // -------------------------------------------------------------------------
  // Card selection step
  // -------------------------------------------------------------------------

  it('transitions to awaiting_confirmation after the user selects a card from the list', async () => {
    const availableCards = [NUBANK_CARD, ITAU_CARD]
    const pendingExpense: PendingExpenseData = {
      description: 'mercado',
      amountInReais: 120,
      category: 'Mercado',
      date: '2026-03-12',
      paymentType: 'credito',
      availableCards,
    }

    const session = makeSession()
    const context = makeContext(
      {
        previousState: { intent: 'register_expense', step: 'card_selection_required' },
        previousOperation: { type: 'register_expense', data: pendingExpense as unknown as Record<string, unknown> },
        interactiveReplyId: 'card-nubank',
      },
      session,
    )
    const { fn: reply } = makeReply()

    await handleRegisterExpense(makeIntent(), context, reply)

    assert.strictEqual(sendButtonMessageMock.mock.callCount(), 1, 'should send confirmation after card selection')
    assert.strictEqual(session.state?.step, 'awaiting_confirmation')

    const savedExpense = session.operation?.data as unknown as PendingExpenseData
    assert.strictEqual(savedExpense.card?.id, 'card-nubank')
    assert.strictEqual(savedExpense.invoiceDueMonthId, 202604) // March 12 > closingDay 3 → April 2026
  })

  it('re-sends the card list when user sends text instead of selecting from list', async () => {
    const availableCards = [NUBANK_CARD, ITAU_CARD]
    const pendingExpense: PendingExpenseData = {
      description: 'mercado',
      amountInReais: 120,
      category: 'Mercado',
      date: '2026-03-12',
      paymentType: 'credito',
      availableCards,
    }

    const session = makeSession()
    const context = makeContext(
      {
        previousState: { intent: 'register_expense', step: 'card_selection_required' },
        previousOperation: { type: 'register_expense', data: pendingExpense as unknown as Record<string, unknown> },
        interactiveReplyId: null, // text message, no selection
      },
      session,
    )
    const { fn: reply } = makeReply()

    await handleRegisterExpense(makeIntent({ description: 'nubank' }), context, reply)

    assert.strictEqual(sendListMessageMock.mock.callCount(), 1, 'should re-send the card list')
    assert.strictEqual(session.state?.step, 'card_selection_required')
  })

  // -------------------------------------------------------------------------
  // Awaiting confirmation step
  // -------------------------------------------------------------------------

  it('calls registerExpense and clears session state when user confirms', async () => {
    const pendingExpense: PendingExpenseData = {
      description: 'uber',
      amountInReais: 28,
      category: 'Transporte',
      date: '2026-03-12',
      paymentType: 'debito',
    }

    const session = makeSession()
    const context = makeContext(
      {
        previousState: { intent: 'register_expense', step: 'awaiting_confirmation' },
        previousOperation: { type: 'register_expense', data: pendingExpense as unknown as Record<string, unknown> },
        interactiveReplyId: 'confirm_expense',
      },
      session,
    )
    const { fn: reply, calls } = makeReply()

    await handleRegisterExpense(makeIntent(), context, reply)

    assert.strictEqual(registerExpenseMock.mock.callCount(), 1, 'should call registerExpense')
    assert.strictEqual(calls.length, 1, 'should reply with success message')
    assert.ok(calls[0].includes('28') || calls[0].includes('Pronto') || calls[0].includes('uber'))

    const callArgs = (registerExpenseMock.mock.calls[0] as unknown as { arguments: unknown[] }).arguments[0] as Record<string, unknown>
    assert.strictEqual(callArgs.userId, 'user-123')
    assert.strictEqual(callArgs.description, 'uber')
    assert.strictEqual(callArgs.amountInReais, 28)
    assert.strictEqual(callArgs.category, 'Transporte')
    assert.strictEqual(callArgs.date, '2026-03-12')
    assert.strictEqual(callArgs.creditCardId, undefined)

    // Session should NOT have a pending state after successful registration
    assert.strictEqual(session.state, null)
    assert.strictEqual(session.operation, null)
  })

  it('passes creditCardId and invoiceDueMonthId to registerExpense for credit expenses', async () => {
    const pendingExpense: PendingExpenseData = {
      description: 'mercado',
      amountInReais: 120,
      category: 'Mercado',
      date: '2026-03-12',
      paymentType: 'credito',
      card: NUBANK_CARD,
      invoiceDueMonthId: 202604,
    }

    const session = makeSession()
    const context = makeContext(
      {
        previousState: { intent: 'register_expense', step: 'awaiting_confirmation' },
        previousOperation: { type: 'register_expense', data: pendingExpense as unknown as Record<string, unknown> },
        interactiveReplyId: 'confirm_expense',
      },
      session,
    )
    const { fn: reply } = makeReply()

    await handleRegisterExpense(makeIntent(), context, reply)

    const callArgs = (registerExpenseMock.mock.calls[0] as unknown as { arguments: unknown[] }).arguments[0] as Record<string, unknown>
    assert.strictEqual(callArgs.creditCardId, 'card-nubank')
    assert.strictEqual(callArgs.invoiceDueMonthId, 202604)
  })

  it('applies a field edit and re-sends confirmation when user sends text during awaiting_confirmation', async () => {
    const pendingExpense: PendingExpenseData = {
      description: 'uber',
      amountInReais: 28,
      category: 'Transporte',
      date: '2026-03-12',
      paymentType: 'debito',
    }

    const session = makeSession()
    const context = makeContext(
      {
        previousState: { intent: 'register_expense', step: 'awaiting_confirmation' },
        previousOperation: { type: 'register_expense', data: pendingExpense as unknown as Record<string, unknown> },
        interactiveReplyId: null, // text message, not a button click
      },
      session,
    )
    const { fn: reply } = makeReply()

    // User edits the amount
    await handleRegisterExpense(
      makeIntent({ intent: 'register_expense', amount: 35 }),
      context,
      reply,
    )

    assert.strictEqual(registerExpenseMock.mock.callCount(), 0, 'should NOT register expense during edit')
    assert.strictEqual(sendButtonMessageMock.mock.callCount(), 1, 'should re-send confirmation')
    assert.strictEqual(session.state?.step, 'awaiting_confirmation', 'should remain in confirmation step')

    const savedExpense = session.operation?.data as unknown as PendingExpenseData
    assert.strictEqual(savedExpense.amountInReais, 35, 'should update the amount')
    assert.strictEqual(savedExpense.description, 'uber', 'should preserve unchanged fields')
  })

  it('clears card data and re-sends confirmation when user switches to debit during edit', async () => {
    const pendingExpense: PendingExpenseData = {
      description: 'mercado',
      amountInReais: 120,
      category: 'Mercado',
      date: '2026-03-12',
      paymentType: 'credito',
      card: NUBANK_CARD,
      invoiceDueMonthId: 202604,
    }

    const session = makeSession()
    const context = makeContext(
      {
        previousState: { intent: 'register_expense', step: 'awaiting_confirmation' },
        previousOperation: { type: 'register_expense', data: pendingExpense as unknown as Record<string, unknown> },
        interactiveReplyId: null,
      },
      session,
    )
    const { fn: reply } = makeReply()

    await handleRegisterExpense(
      makeIntent({ intent: 'register_expense', paymentType: 'debito' }),
      context,
      reply,
    )

    assert.strictEqual(sendButtonMessageMock.mock.callCount(), 1, 'should re-send confirmation')
    assert.strictEqual(session.state?.step, 'awaiting_confirmation')

    const savedExpense = session.operation?.data as unknown as PendingExpenseData
    assert.strictEqual(savedExpense.paymentType, 'debito', 'should update payment type')
    assert.strictEqual(savedExpense.card, undefined, 'should clear card when switching to debit')
    assert.strictEqual(savedExpense.invoiceDueMonthId, undefined, 'should clear invoice month when switching to debit')
  })

  it('does NOT call registerExpense when user sends plain text "sim" (without button click)', async () => {
    const pendingExpense: PendingExpenseData = {
      description: 'uber',
      amountInReais: 28,
      category: 'Transporte',
      date: '2026-03-12',
      paymentType: 'debito',
    }

    const session = makeSession()
    const context = makeContext(
      {
        previousState: { intent: 'register_expense', step: 'awaiting_confirmation' },
        previousOperation: { type: 'register_expense', data: pendingExpense as unknown as Record<string, unknown> },
        interactiveReplyId: null, // no button — just text
      },
      session,
    )
    const { fn: reply } = makeReply()

    // "sim" without the interactive button should be treated as an irrelevant edit,
    // not as a confirmation
    await handleRegisterExpense(
      makeIntent({ intent: 'register_expense' }),
      context,
      reply,
    )

    assert.strictEqual(
      registerExpenseMock.mock.callCount(),
      0,
      'should NOT call registerExpense for plain text "sim" — only button click confirms',
    )
  })
})
