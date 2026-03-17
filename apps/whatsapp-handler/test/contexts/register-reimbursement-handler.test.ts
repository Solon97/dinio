import { after, before, beforeEach, describe, it } from 'node:test'
import assert from 'node:assert'
import { mock } from 'node:test'

import {
  buildReimbursementConfirmationText,
} from '../../src/contexts/intents/handlers/helpers'
import type { IntentContext, ParsedIntent, ReplyFunction } from '../../src/contexts/intents/types'
import type { ChatSession, PendingReimbursementData } from '../../src/contexts/session/types'

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
    logResponse: () => {},
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
    intent: 'register_reimbursement',
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

const DEFAULT_REGISTER_RESULT = {
  expense_saved: true,
  today_spent: 5000,
  recommended_today: 3000,
  month_balance: 100000,
}

// ---------------------------------------------------------------------------
// Pure helper tests
// ---------------------------------------------------------------------------

describe('buildReimbursementConfirmationText', () => {
  it('includes description, amount, category, and date', () => {
    const pending: PendingReimbursementData = {
      description: 'uber',
      amountInReais: 50,
      category: 'Transporte',
      date: '2026-03-12',
    }
    const text = buildReimbursementConfirmationText(pending)
    assert.ok(text.includes('R$'), 'should include currency symbol')
    assert.ok(text.includes('50'), 'should include amount')
    assert.ok(text.includes('12/03/2026'), 'should include formatted date')
    assert.ok(text.includes('Transporte'), 'should include category')
    assert.ok(text.toLowerCase().includes('reembolso'), 'should mention reimbursement')
  })
})

// ---------------------------------------------------------------------------
// handleRegisterReimbursement handler tests
// ---------------------------------------------------------------------------

describe('handleRegisterReimbursement', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const apiClientModule = require('../../src/contexts/dinio/dinio-api-client') as Record<string, unknown>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const whatsappClientModule = require('../../src/contexts/whatsapp/whatsapp-client') as Record<string, unknown>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { handleRegisterReimbursement } = require('../../src/contexts/intents/handlers/register-reimbursement.handler') as typeof import('../../src/contexts/intents/handlers/register-reimbursement.handler')

  const originals = {
    registerReimbursement: apiClientModule.registerReimbursement,
    sendButtonMessage: whatsappClientModule.sendButtonMessage,
  }

  let throwOnRegisterReimbursement = false

  const registerReimbursementMock = mock.fn(async () => {
    if (throwOnRegisterReimbursement) throw new Error('API error')
    return { ...DEFAULT_REGISTER_RESULT }
  })

  const sendButtonMessageMock = mock.fn(async () => {})

  before(() => {
    apiClientModule.registerReimbursement = registerReimbursementMock
    whatsappClientModule.sendButtonMessage = sendButtonMessageMock
  })

  after(() => {
    apiClientModule.registerReimbursement = originals.registerReimbursement
    whatsappClientModule.sendButtonMessage = originals.sendButtonMessage
  })

  beforeEach(() => {
    throwOnRegisterReimbursement = false
    registerReimbursementMock.mock.resetCalls()
    sendButtonMessageMock.mock.resetCalls()
  })

  // -------------------------------------------------------------------------
  // Starting a new reimbursement flow
  // -------------------------------------------------------------------------

  it('replies asking for amount when none is provided', async () => {
    const session = makeSession()
    const context = makeContext({}, session)
    const { fn: reply, calls } = makeReply()

    await handleRegisterReimbursement(makeIntent({ description: 'uber' }), context, reply)

    assert.strictEqual(calls.length, 1)
    assert.ok(calls[0].includes('valor'), 'should tell user to provide the amount')
    assert.strictEqual(session.state, null, 'should not change session state')
    assert.strictEqual(sendButtonMessageMock.mock.callCount(), 0)
  })

  it('replies asking for date when date cannot be resolved', async () => {
    const session = makeSession()
    const context = makeContext({}, session)
    const { fn: reply, calls } = makeReply()

    await handleRegisterReimbursement(
      makeIntent({ description: 'uber', amount: 50, expenseDate: 'invalid-date' }),
      context,
      reply,
    )

    assert.strictEqual(calls.length, 1)
    assert.ok(calls[0].includes('data'), 'should mention date')
    assert.strictEqual(session.state, null, 'should not change session state')
    assert.strictEqual(sendButtonMessageMock.mock.callCount(), 0)
  })

  it('sends confirmation button for a valid reimbursement', async () => {
    const session = makeSession()
    const context = makeContext({}, session)
    const { fn: reply } = makeReply()

    await handleRegisterReimbursement(
      makeIntent({ description: 'uber', amount: 50, category: 'transporte', expenseDate: '2026-03-12' }),
      context,
      reply,
    )

    assert.strictEqual(sendButtonMessageMock.mock.callCount(), 1, 'should send button message')
    assert.strictEqual(session.state?.step, 'awaiting_confirmation')
    assert.strictEqual(session.state?.intent, 'register_reimbursement')

    const savedData = session.operation?.data as unknown as PendingReimbursementData
    assert.strictEqual(savedData.amountInReais, 50)
    assert.strictEqual(savedData.description, 'uber')
    assert.strictEqual(savedData.date, '2026-03-12')
    assert.strictEqual(savedData.category, 'Transporte')
  })

  it('defaults description to "reembolso" when not provided', async () => {
    const session = makeSession()
    const context = makeContext({}, session)
    const { fn: reply } = makeReply()

    await handleRegisterReimbursement(
      makeIntent({ amount: 80, expenseDate: '2026-03-12' }),
      context,
      reply,
    )

    const savedData = session.operation?.data as unknown as PendingReimbursementData
    assert.strictEqual(savedData.description, 'reembolso')
  })

  // -------------------------------------------------------------------------
  // Confirmation step
  // -------------------------------------------------------------------------

  it('calls registerReimbursement and replies with success when user confirms', async () => {
    const pendingData: PendingReimbursementData = {
      description: 'ifood',
      amountInReais: 30,
      category: 'Delivery',
      date: '2026-03-12',
    }

    const session = makeSession({
      state: { intent: 'register_reimbursement', step: 'awaiting_confirmation' },
      operation: { type: 'register_reimbursement', data: pendingData as unknown as Record<string, unknown> },
    })
    const context = makeContext({
      previousState: { intent: 'register_reimbursement', step: 'awaiting_confirmation' },
      previousOperation: { type: 'register_reimbursement', data: pendingData as unknown as Record<string, unknown> },
      interactiveReplyId: 'confirm_reimbursement',
    }, session)
    const { fn: reply, calls } = makeReply()

    await handleRegisterReimbursement(makeIntent(), context, reply)

    assert.strictEqual(registerReimbursementMock.mock.callCount(), 1, 'should call registerReimbursement')
    assert.strictEqual(calls.length, 1)
    assert.ok(calls[0].includes('Pronto'), 'should reply with success message')
    assert.ok(calls[0].includes('R$'), 'should include amount in success message')
  })

  it('applies field edit and re-sends confirmation when user sends text during awaiting_confirmation', async () => {
    const pendingData: PendingReimbursementData = {
      description: 'uber',
      amountInReais: 50,
      category: 'Transporte',
      date: '2026-03-12',
    }

    const session = makeSession({
      state: { intent: 'register_reimbursement', step: 'awaiting_confirmation' },
      operation: { type: 'register_reimbursement', data: pendingData as unknown as Record<string, unknown> },
    })
    const context = makeContext({
      previousState: { intent: 'register_reimbursement', step: 'awaiting_confirmation' },
      previousOperation: { type: 'register_reimbursement', data: pendingData as unknown as Record<string, unknown> },
      interactiveReplyId: null,
    }, session)
    const { fn: reply } = makeReply()

    await handleRegisterReimbursement(
      makeIntent({ amount: 75 }),
      context,
      reply,
    )

    assert.strictEqual(registerReimbursementMock.mock.callCount(), 0, 'should not call API on edit')
    assert.strictEqual(sendButtonMessageMock.mock.callCount(), 1, 'should re-send confirmation button')

    const savedData = session.operation?.data as unknown as PendingReimbursementData
    assert.strictEqual(savedData.amountInReais, 75, 'should update the amount')
    assert.strictEqual(savedData.description, 'uber', 'should preserve unchanged fields')
  })

  it('handles API error gracefully', async () => {
    throwOnRegisterReimbursement = true

    const pendingData: PendingReimbursementData = {
      description: 'farmácia',
      amountInReais: 80,
      category: 'Saúde',
      date: '2026-03-12',
    }

    const session = makeSession({
      state: { intent: 'register_reimbursement', step: 'awaiting_confirmation' },
      operation: { type: 'register_reimbursement', data: pendingData as unknown as Record<string, unknown> },
    })
    const context = makeContext({
      previousState: { intent: 'register_reimbursement', step: 'awaiting_confirmation' },
      previousOperation: { type: 'register_reimbursement', data: pendingData as unknown as Record<string, unknown> },
      interactiveReplyId: 'confirm_reimbursement',
    }, session)
    const { fn: reply, calls } = makeReply()

    await handleRegisterReimbursement(makeIntent(), context, reply)

    assert.strictEqual(calls.length, 1)
    assert.ok(calls[0].toLowerCase().includes('não consegui'), 'should reply with error message')
  })
})
