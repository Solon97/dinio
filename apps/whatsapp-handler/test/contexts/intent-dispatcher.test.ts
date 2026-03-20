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
  const { handleRegisterMultipleExpenses } = require('../../src/contexts/intents/handlers/register-multiple-expenses.handler') as typeof import('../../src/contexts/intents/handlers/register-multiple-expenses.handler')

  const originals = {
    registerExpense: apiClientModule.registerExpense,
    getCreditCards: apiClientModule.getCreditCards,
  }

  let throwOnRegisterExpense = false
  let registerExpenseCallCount = 0

  before(() => {
    apiClientModule.registerExpense = async () => {
      if (throwOnRegisterExpense) throw new Error('API error')
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
    throwOnRegisterExpense = false
    registerExpenseCallCount = 0
  })

  it('registers all expenses and shows a summary with all items checked', async () => {
    const intents: ParsedIntent[] = [
      makeExpenseIntent({ description: 'uber', amount: 28 }),
      makeExpenseIntent({ description: 'pizza', amount: 45, category: 'restaurantes' }),
      makeExpenseIntent({ description: 'mercado', amount: 120, category: 'mercado' }),
    ]
    const context = makeContext()
    const { fn: reply, calls } = makeReply()

    await handleRegisterMultipleExpenses(intents, context, reply)

    assert.strictEqual(registerExpenseCallCount, 3, 'should call registerExpense for each intent')
    assert.strictEqual(calls.length, 1, 'should send one combined reply')
    assert.ok(calls[0].includes('Uber'), 'summary should include Uber')
    assert.ok(calls[0].includes('Pizza'), 'summary should include Pizza')
    assert.ok(calls[0].includes('Mercado'), 'summary should include Mercado')
    assert.ok(calls[0].includes('✅'), 'should use checkmarks for successful items')
  })

  it('skips intents with invalid amounts and reports them as failed', async () => {
    const intents: ParsedIntent[] = [
      makeExpenseIntent({ description: 'uber', amount: 28 }),
      makeExpenseIntent({ description: 'sem valor', amount: 0 }),
    ]
    const context = makeContext()
    const { fn: reply, calls } = makeReply()

    await handleRegisterMultipleExpenses(intents, context, reply)

    assert.strictEqual(registerExpenseCallCount, 1, 'should only register the valid expense')
    assert.ok(calls[0].includes('✅'), 'should check successful item')
    assert.ok(calls[0].includes('❌'), 'should mark failed item')
  })

  it('handles API failure gracefully and reports partial success', async () => {
    let callCount = 0
    apiClientModule.registerExpense = async () => {
      callCount++
      if (callCount === 2) throw new Error('API error')
      return { ...DEFAULT_REGISTER_RESULT }
    }

    const intents: ParsedIntent[] = [
      makeExpenseIntent({ description: 'uber', amount: 28 }),
      makeExpenseIntent({ description: 'pizza', amount: 45 }),
      makeExpenseIntent({ description: 'mercado', amount: 120 }),
    ]
    const context = makeContext()
    const { fn: reply, calls } = makeReply()

    await handleRegisterMultipleExpenses(intents, context, reply)

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
    const intents: ParsedIntent[] = [
      makeExpenseIntent({ description: 'uber', amount: 28 }),
      makeExpenseIntent({ description: 'pizza', amount: 45 }),
    ]
    const context = makeContext()
    const { fn: reply, calls } = makeReply()

    await dispatchIntent(intents, context, reply)

    assert.strictEqual(registerExpenseCallCount, 2, 'both expenses should be registered')
    assert.strictEqual(calls.length, 1, 'should produce one combined reply')
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
