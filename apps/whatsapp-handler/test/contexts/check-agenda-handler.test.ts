import { after, before, beforeEach, describe, it, mock } from 'node:test'
import assert from 'node:assert'

import { buildAgendaMessage } from '../../src/contexts/intents/handlers/check-agenda.handler'
import type { IntentContext, ReplyFunction } from '../../src/contexts/intents/types'
import type { ChatSession } from '../../src/contexts/session/types'
import type { BotAgendaItem } from '../../src/contexts/dinio/dinio-api-client'

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

// ---------------------------------------------------------------------------
// Pure helper: buildAgendaMessage
// ---------------------------------------------------------------------------

describe('buildAgendaMessage', () => {
  it('returns empty-agenda message when items array is empty', () => {
    const msg = buildAgendaMessage([])
    assert.ok(msg.includes('Nenhum compromisso'), `expected empty-agenda message, got: ${msg}`)
  })

  it('includes the count and label "compromisso" for a single item', () => {
    const items: BotAgendaItem[] = [{ name: 'Conta de luz', amountCents: 15000 }]
    const msg = buildAgendaMessage(items)
    assert.ok(msg.includes('1 compromisso'), `expected "1 compromisso" in: ${msg}`)
  })

  it('uses plural "compromissos" for multiple items', () => {
    const items: BotAgendaItem[] = [
      { name: 'Internet', amountCents: 9990 },
      { name: 'Fatura Nubank', amountCents: null },
    ]
    const msg = buildAgendaMessage(items)
    assert.ok(msg.includes('2 compromissos'), `expected "2 compromissos" in: ${msg}`)
  })

  it('formats an item with amountCents as a currency string', () => {
    const items: BotAgendaItem[] = [{ name: 'Internet', amountCents: 9990 }]
    const msg = buildAgendaMessage(items)
    assert.ok(msg.includes('Internet'), `expected item name in: ${msg}`)
    assert.ok(msg.includes('R$'), `expected currency symbol in: ${msg}`)
  })

  it('formats an item with null amountCents without a currency string', () => {
    const items: BotAgendaItem[] = [{ name: 'Fatura Nubank', amountCents: null }]
    const msg = buildAgendaMessage(items)
    assert.ok(msg.includes('Fatura Nubank'), `expected item name in: ${msg}`)
    assert.ok(!msg.includes('— R$'), `should not include currency for null amount, got: ${msg}`)
  })

  it('caps the displayed items at 5 and shows remaining count', () => {
    const items: BotAgendaItem[] = Array.from({ length: 7 }, (_, i) => ({
      name: `Item ${i + 1}`,
      amountCents: 1000,
    }))
    const msg = buildAgendaMessage(items)
    assert.ok(msg.includes('+ 2 outros'), `expected "+ 2 outros" in: ${msg}`)
    assert.ok(!msg.includes('Item 6'), `item 6 should not appear in: ${msg}`)
  })

  it('shows singular "outro" when exactly one item is hidden', () => {
    const items: BotAgendaItem[] = Array.from({ length: 6 }, (_, i) => ({
      name: `Item ${i + 1}`,
      amountCents: 500,
    }))
    const msg = buildAgendaMessage(items)
    assert.ok(msg.includes('+ 1 outro'), `expected "+ 1 outro" in: ${msg}`)
  })

  it('does not show remaining indicator when 5 or fewer items', () => {
    const items: BotAgendaItem[] = Array.from({ length: 5 }, (_, i) => ({
      name: `Item ${i + 1}`,
      amountCents: 500,
    }))
    const msg = buildAgendaMessage(items)
    assert.ok(!msg.includes('outro'), `should not show remainder for 5 items, got: ${msg}`)
  })
})

// ---------------------------------------------------------------------------
// Handler integration: handleCheckAgenda
// ---------------------------------------------------------------------------

describe('handleCheckAgenda', () => {
  // Load module objects so we can monkey-patch them (same pattern as register-expense tests)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const apiClientModule = require('../../src/contexts/dinio/dinio-api-client') as Record<string, unknown>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { handleCheckAgenda } = require('../../src/contexts/intents/handlers/check-agenda.handler') as typeof import('../../src/contexts/intents/handlers/check-agenda.handler')

  const originalGetAgenda = apiClientModule.getAgenda

  let throwOnGetAgenda = false
  let agendaItemsToReturn: BotAgendaItem[] = []

  const getAgendaMock = mock.fn(async () => {
    if (throwOnGetAgenda) throw new Error('network error')
    return { items: agendaItemsToReturn }
  })

  before(() => {
    apiClientModule.getAgenda = getAgendaMock
  })

  after(() => {
    apiClientModule.getAgenda = originalGetAgenda
  })

  beforeEach(() => {
    throwOnGetAgenda = false
    agendaItemsToReturn = []
    getAgendaMock.mock.resetCalls()
  })

  it('replies with empty-agenda message when API returns no items', async () => {
    const context = makeContext()
    const { fn: reply, calls } = makeReply()

    await handleCheckAgenda(context, reply)

    assert.strictEqual(calls.length, 1)
    assert.ok(calls[0].includes('Nenhum compromisso'), `unexpected reply: ${calls[0]}`)
  })

  it('replies with agenda items when API returns commitments', async () => {
    agendaItemsToReturn = [
      { name: 'Conta de luz', amountCents: 15000 },
      { name: 'Fatura Nubank', amountCents: null },
    ]
    const context = makeContext()
    const { fn: reply, calls } = makeReply()

    await handleCheckAgenda(context, reply)

    assert.strictEqual(calls.length, 1)
    assert.ok(calls[0].includes('2 compromissos'), `unexpected reply: ${calls[0]}`)
    assert.ok(calls[0].includes('Conta de luz'), `missing item name: ${calls[0]}`)
  })

  it('calls getAgenda with the correct userId', async () => {
    const context = makeContext({ userId: 'abc-456' })
    const { fn: reply } = makeReply()

    await handleCheckAgenda(context, reply)

    assert.strictEqual(getAgendaMock.mock.callCount(), 1)
    const callArgs = (getAgendaMock.mock.calls[0] as unknown as { arguments: unknown[] }).arguments[0]
    assert.strictEqual(callArgs, 'abc-456')
  })

  it('replies with an error message when the API throws', async () => {
    throwOnGetAgenda = true
    const context = makeContext()
    const { fn: reply, calls } = makeReply()

    await handleCheckAgenda(context, reply)

    assert.strictEqual(calls.length, 1)
    assert.ok(calls[0].length > 0, 'should reply something on error')
  })
})
