import { after, before, beforeEach, describe, it } from 'node:test'
import assert from 'node:assert'

import type { IntentContext, ParsedIntent, ReplyFunction } from '../../src/contexts/intents/types'
import type { ChatSession } from '../../src/contexts/session/types'

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

function makeContext(overrides: Partial<IntentContext> = {}): IntentContext {
  return {
    userId: 'user-123',
    phone: '5511999999999',
    session: makeSession(),
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

function makeExpenseIntent(overrides: Partial<ParsedIntent> = {}): ParsedIntent {
  return {
    intent: 'register_expense',
    description: 'uber',
    amount: 28,
    category: 'transporte',
    answer: null,
    expenseDate: 'hoje',
    paymentType: 'debito',
    cardNameMention: null,
    isRefund: null,
    ...overrides,
  }
}

const DEFAULT_REGISTER_RESULT = {
  expense_saved: true,
  today_spent: 5000,
  recommended_today: 3000,
  month_balance: 100000,
}

// ---------------------------------------------------------------------------
// handleRegisterMultipleExpenses tests
// ---------------------------------------------------------------------------

describe('handleRegisterMultipleExpenses', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const apiClientModule = require('../../src/contexts/dinio/dinio-api-client') as Record<string, unknown>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const whatsappClientModule = require('../../src/contexts/whatsapp/whatsapp-client') as Record<string, unknown>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { handleRegisterMultipleExpenses, handleBulkExpenseConfirmation } = require('../../src/contexts/intents/handlers/register-multiple-expenses.handler') as typeof import('../../src/contexts/intents/handlers/register-multiple-expenses.handler')

  const originals = {
    registerExpense: apiClientModule.registerExpense,
    getCreditCards: apiClientModule.getCreditCards,
    sendButtonMessage: whatsappClientModule.sendButtonMessage,
  }

  let registerExpenseCallCount = 0
  let sendButtonMessageCallCount = 0

  before(() => {
    apiClientModule.registerExpense = async () => {
      registerExpenseCallCount++
      return { ...DEFAULT_REGISTER_RESULT }
    }
    apiClientModule.getCreditCards = async () => []
    whatsappClientModule.sendButtonMessage = async () => {
      sendButtonMessageCallCount++
    }
  })

  after(() => {
    apiClientModule.registerExpense = originals.registerExpense
    apiClientModule.getCreditCards = originals.getCreditCards
    whatsappClientModule.sendButtonMessage = originals.sendButtonMessage
  })

  beforeEach(() => {
    registerExpenseCallCount = 0
    sendButtonMessageCallCount = 0
  })

  it('stores all valid items in session and sends confirmation button', async () => {
    const intents: ParsedIntent[] = [
      makeExpenseIntent({ description: 'uber', amount: 28 }),
      makeExpenseIntent({ description: 'pizza', amount: 45, category: 'restaurantes' }),
      makeExpenseIntent({ description: 'mercado', amount: 120, category: 'mercado' }),
    ]
    const context = makeContext()
    const { fn: reply, calls } = makeReply()

    await handleRegisterMultipleExpenses(intents, context, reply)

    assert.strictEqual(registerExpenseCallCount, 0, 'should not register immediately — awaiting confirmation')
    assert.strictEqual(sendButtonMessageCallCount, 1, 'should send confirmation button')
    assert.strictEqual(calls.length, 0, 'should not call reply directly')
    const items = (context.session.operation?.data as { items: unknown[] })?.items
    assert.strictEqual(items?.length, 3, 'should store all 3 items in session')
  })

  it('skips intents with invalid amounts (≤ 0)', async () => {
    const intents: ParsedIntent[] = [
      makeExpenseIntent({ description: 'uber', amount: 28 }),
      makeExpenseIntent({ description: 'sem valor', amount: 0 }),
    ]
    const context = makeContext()
    const { fn: reply, calls } = makeReply()

    await handleRegisterMultipleExpenses(intents, context, reply)

    assert.strictEqual(registerExpenseCallCount, 0, 'should not register immediately')
    assert.strictEqual(sendButtonMessageCallCount, 1, 'should send confirmation button for the valid item')
    assert.strictEqual(calls.length, 0, 'should not call reply directly')
    const items = (context.session.operation?.data as { items: unknown[] })?.items
    assert.strictEqual(items?.length, 1, 'should only store the valid item in session')
  })

  it('handles API failure gracefully and reports partial success on confirmation', async () => {
    let callCount = 0
    apiClientModule.registerExpense = async () => {
      callCount++
      if (callCount === 2) throw new Error('API error')
      return { ...DEFAULT_REGISTER_RESULT }
    }

    const items = [
      { description: 'Uber', amountInReais: 28, category: 'Transporte', date: '2026-01-10', paymentType: 'debito', isRefund: false },
      { description: 'Pizza', amountInReais: 45, category: 'Restaurantes', date: '2026-01-10', paymentType: 'debito', isRefund: false },
      { description: 'Mercado', amountInReais: 120, category: 'Mercado', date: '2026-01-10', paymentType: 'debito', isRefund: false },
    ]
    const context = makeContext({
      previousState: { intent: 'register_expense', step: 'bulk_awaiting_confirmation' },
      previousOperation: { type: 'register_expense', data: { items } },
      interactiveReplyId: 'confirm_expense',
    })
    const { fn: reply, calls } = makeReply()

    await handleBulkExpenseConfirmation(context, reply)

    assert.ok(calls[0].includes('✅'), 'should report successful items')
    assert.ok(calls[0].includes('❌'), 'should report failed items')
  })
})

// ---------------------------------------------------------------------------
// dispatchIntent multi-intent routing tests
// ---------------------------------------------------------------------------

describe('dispatchIntent', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const apiClientModule = require('../../src/contexts/dinio/dinio-api-client') as Record<string, unknown>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { dispatchIntent } = require('../../src/contexts/intents/intent-dispatcher') as typeof import('../../src/contexts/intents/intent-dispatcher')

  const originals = {
    registerExpense: apiClientModule.registerExpense,
    getCreditCards: apiClientModule.getCreditCards,
  }

  let registerExpenseCallCount = 0

  before(() => {
    apiClientModule.registerExpense = async () => {
      registerExpenseCallCount++
      return { ...DEFAULT_REGISTER_RESULT }
    }
    apiClientModule.getCreditCards = async () => []
  })

  after(() => {
    apiClientModule.registerExpense = originals.registerExpense
    apiClientModule.getCreditCards = originals.getCreditCards
  })

  beforeEach(() => {
    registerExpenseCallCount = 0
  })

  it('routes multiple register_expense intents to the bulk handler', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const whatsappClientModule = require('../../src/contexts/whatsapp/whatsapp-client') as Record<string, unknown>
    const origSendButton = whatsappClientModule.sendButtonMessage
    let sendButtonCalled = false
    whatsappClientModule.sendButtonMessage = async () => { sendButtonCalled = true }

    const intents: ParsedIntent[] = [
      makeExpenseIntent({ description: 'uber', amount: 28 }),
      makeExpenseIntent({ description: 'pizza', amount: 45 }),
    ]
    const context = makeContext()
    const { fn: reply, calls } = makeReply()

    await dispatchIntent(intents, context, reply)

    assert.strictEqual(registerExpenseCallCount, 0, 'should not register immediately — awaiting confirmation')
    assert.ok(sendButtonCalled, 'should send confirmation button for bulk expenses')
    assert.strictEqual(calls.length, 0, 'reply should not be called directly')
    const items = (context.session.operation?.data as { items: unknown[] })?.items
    assert.strictEqual(items?.length, 2, 'should store both items in session')

    whatsappClientModule.sendButtonMessage = origSendButton
  })

  it('routes a single unknown intent to the unknown handler', async () => {
    const intents: ParsedIntent[] = [
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
    const context = makeContext()
    const { fn: reply, calls } = makeReply()

    await dispatchIntent(intents, context, reply)

    assert.strictEqual(registerExpenseCallCount, 0, 'should not register any expense')
    assert.strictEqual(calls.length, 1, 'should send one reply')
    assert.ok(calls[0].includes('Não consegui entender'), 'should reply with unknown message')
  })

  it('uses single-intent handler for a single register_expense (preserves confirmation flow)', async () => {
    // A single expense should go through the normal flow (confirmation button),
    // NOT the bulk handler. We verify this by checking that registerExpense
    // is NOT called immediately (the handler waits for user confirmation).
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const whatsappClientModule = require('../../src/contexts/whatsapp/whatsapp-client') as Record<string, unknown>
    const origSendButton = whatsappClientModule.sendButtonMessage
    let sendButtonCalled = false
    whatsappClientModule.sendButtonMessage = async () => {
      sendButtonCalled = true
    }

    const intents: ParsedIntent[] = [makeExpenseIntent({ description: 'uber', amount: 28 })]
    const context = makeContext()
    const { fn: reply } = makeReply()

    await dispatchIntent(intents, context, reply)

    assert.strictEqual(registerExpenseCallCount, 0, 'single expense should wait for confirmation — not register immediately')
    assert.ok(sendButtonCalled, 'single expense should send a confirmation button')

    whatsappClientModule.sendButtonMessage = origSendButton
  })
})
