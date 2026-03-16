import { after, before, beforeEach, describe, it, mock } from 'node:test'
import assert from 'node:assert'

import {
  buildAgendaMessage,
  buildWeekAgendaMessage,
  buildMonthAgendaMessage,
} from '../../src/contexts/intents/handlers/check-agenda.handler'
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
// Pure helper: buildAgendaMessage (day)
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

  it('uses "para hoje" phrasing', () => {
    const items: BotAgendaItem[] = [{ name: 'Conta de luz', amountCents: 1000 }]
    const msg = buildAgendaMessage(items)
    assert.ok(msg.includes('para hoje'), `expected "para hoje" in: ${msg}`)
  })
})

// ---------------------------------------------------------------------------
// Pure helper: buildWeekAgendaMessage
// ---------------------------------------------------------------------------

describe('buildWeekAgendaMessage', () => {
  it('returns empty-agenda message for empty items', () => {
    const msg = buildWeekAgendaMessage([])
    assert.ok(msg.includes('Nenhum compromisso'), `expected empty-agenda message, got: ${msg}`)
    assert.ok(msg.includes('semana'), `expected "semana" in: ${msg}`)
  })

  it('uses "nesta semana" phrasing for non-empty items', () => {
    const items: BotAgendaItem[] = [{ name: 'Internet', amountCents: 9990, date: '2026-03-20' }]
    const msg = buildWeekAgendaMessage(items)
    assert.ok(msg.includes('nesta semana'), `expected "nesta semana" in: ${msg}`)
  })

  it('includes weekday abbreviation and day/month from item date', () => {
    // 2026-03-16 is a Monday
    const items: BotAgendaItem[] = [{ name: 'Conta de luz', amountCents: 15000, date: '2026-03-16' }]
    const msg = buildWeekAgendaMessage(items)
    assert.ok(msg.includes('Seg'), `expected weekday abbreviation "Seg" in: ${msg}`)
    assert.ok(msg.includes('16/03'), `expected "16/03" in: ${msg}`)
  })

  it('formats item amount correctly when date is present', () => {
    const items: BotAgendaItem[] = [{ name: 'Internet', amountCents: 9990, date: '2026-03-19' }]
    const msg = buildWeekAgendaMessage(items)
    assert.ok(msg.includes('Internet'), `expected item name in: ${msg}`)
    assert.ok(msg.includes('R$'), `expected currency symbol in: ${msg}`)
  })

  it('handles item with null amountCents and date', () => {
    const items: BotAgendaItem[] = [{ name: 'Fatura Nubank', amountCents: null, date: '2026-03-20' }]
    const msg = buildWeekAgendaMessage(items)
    assert.ok(msg.includes('Fatura Nubank'), `expected item name in: ${msg}`)
    assert.ok(!msg.includes('— R$'), `should not include currency for null amount, got: ${msg}`)
  })

  it('caps displayed items at 5 and shows remaining count', () => {
    const items: BotAgendaItem[] = Array.from({ length: 7 }, (_, i) => ({
      name: `Item ${i + 1}`,
      amountCents: 1000,
      date: `2026-03-${String(16 + i).padStart(2, '0')}`,
    }))
    const msg = buildWeekAgendaMessage(items)
    assert.ok(msg.includes('+ 2 outros'), `expected "+ 2 outros" in: ${msg}`)
  })
})

// ---------------------------------------------------------------------------
// Pure helper: buildMonthAgendaMessage
// ---------------------------------------------------------------------------

describe('buildMonthAgendaMessage', () => {
  it('returns empty-agenda message for empty items', () => {
    const msg = buildMonthAgendaMessage([])
    assert.ok(msg.includes('Nenhum compromisso'), `expected empty-agenda message, got: ${msg}`)
    assert.ok(msg.includes('mês'), `expected "mês" in: ${msg}`)
  })

  it('uses "este mês" phrasing for non-empty items', () => {
    const items: BotAgendaItem[] = [{ name: 'Conta de luz', amountCents: 15000, date: '2026-03-10' }]
    const msg = buildMonthAgendaMessage(items)
    assert.ok(msg.includes('este mês'), `expected "este mês" in: ${msg}`)
  })

  it('includes "Dia N" prefix from item date', () => {
    const items: BotAgendaItem[] = [{ name: 'Conta de luz', amountCents: 15000, date: '2026-03-10' }]
    const msg = buildMonthAgendaMessage(items)
    assert.ok(msg.includes('Dia 10'), `expected "Dia 10" in: ${msg}`)
  })

  it('formats item amount correctly', () => {
    const items: BotAgendaItem[] = [{ name: 'Internet', amountCents: 9990, date: '2026-03-15' }]
    const msg = buildMonthAgendaMessage(items)
    assert.ok(msg.includes('Internet'), `expected item name in: ${msg}`)
    assert.ok(msg.includes('R$'), `expected currency symbol in: ${msg}`)
  })

  it('handles item with null amountCents', () => {
    const items: BotAgendaItem[] = [{ name: 'Fatura Nubank', amountCents: null, date: '2026-03-20' }]
    const msg = buildMonthAgendaMessage(items)
    assert.ok(msg.includes('Fatura Nubank'), `expected item name in: ${msg}`)
    assert.ok(!msg.includes('— R$'), `should not include currency for null amount, got: ${msg}`)
  })

  it('caps displayed items at 5 and shows remaining count', () => {
    const items: BotAgendaItem[] = Array.from({ length: 7 }, (_, i) => ({
      name: `Item ${i + 1}`,
      amountCents: 1000,
      date: `2026-03-${String(5 + i).padStart(2, '0')}`,
    }))
    const msg = buildMonthAgendaMessage(items)
    assert.ok(msg.includes('+ 2 outros'), `expected "+ 2 outros" in: ${msg}`)
  })
})

// ---------------------------------------------------------------------------
// Handler integration: handleCheckAgenda (day)
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

    assert.strictEqual(calls.length, 2)
    assert.ok(calls[0].includes('2 compromissos'), `unexpected reply: ${calls[0]}`)
    assert.ok(calls[0].includes('Conta de luz'), `missing item name: ${calls[0]}`)
  })

  it('calls getAgenda with the correct userId', async () => {
    const context = makeContext({ userId: 'abc-456' })
    const { fn: reply } = makeReply()

    await handleCheckAgenda(context, reply)

    assert.strictEqual(getAgendaMock.mock.callCount(), 2)
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

// ---------------------------------------------------------------------------
// Handler integration: handleCheckAgendaWeek
// ---------------------------------------------------------------------------

describe('handleCheckAgendaWeek', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const apiClientModule = require('../../src/contexts/dinio/dinio-api-client') as Record<string, unknown>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { handleCheckAgendaWeek } = require('../../src/contexts/intents/handlers/check-agenda.handler') as typeof import('../../src/contexts/intents/handlers/check-agenda.handler')

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

  it('replies with empty-week message when API returns no items', async () => {
    const context = makeContext()
    const { fn: reply, calls } = makeReply()

    await handleCheckAgendaWeek(context, reply)

    assert.strictEqual(calls.length, 1)
    assert.ok(calls[0].includes('semana'), `expected "semana" in reply: ${calls[0]}`)
  })

  it('replies with week agenda items when API returns commitments', async () => {
    agendaItemsToReturn = [
      { name: 'Conta de luz', amountCents: 15000, date: '2026-03-16' },
    ]
    const context = makeContext()
    const { fn: reply, calls } = makeReply()

    await handleCheckAgendaWeek(context, reply)

    assert.strictEqual(calls.length, 2)
    assert.ok(calls[0].includes('nesta semana'), `expected "nesta semana" in: ${calls[0]}`)
    assert.ok(calls[0].includes('Conta de luz'), `missing item name: ${calls[0]}`)
  })

  it('calls getAgenda with period="week" and correct userId', async () => {
    const context = makeContext({ userId: 'xyz-789' })
    const { fn: reply } = makeReply()

    await handleCheckAgendaWeek(context, reply)

    assert.strictEqual(getAgendaMock.mock.callCount(), 2)
    const args = (getAgendaMock.mock.calls[0] as unknown as { arguments: unknown[] }).arguments
    assert.strictEqual(args[0], 'xyz-789')
    assert.strictEqual(args[2], 'week')
  })

  it('replies with an error message when the API throws', async () => {
    throwOnGetAgenda = true
    const context = makeContext()
    const { fn: reply, calls } = makeReply()

    await handleCheckAgendaWeek(context, reply)

    assert.strictEqual(calls.length, 1)
    assert.ok(calls[0].length > 0, 'should reply something on error')
  })
})

// ---------------------------------------------------------------------------
// Handler integration: handleCheckAgendaMonth
// ---------------------------------------------------------------------------

describe('handleCheckAgendaMonth', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const apiClientModule = require('../../src/contexts/dinio/dinio-api-client') as Record<string, unknown>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { handleCheckAgendaMonth } = require('../../src/contexts/intents/handlers/check-agenda.handler') as typeof import('../../src/contexts/intents/handlers/check-agenda.handler')

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

  it('replies with empty-month message when API returns no items', async () => {
    const context = makeContext()
    const { fn: reply, calls } = makeReply()

    await handleCheckAgendaMonth(context, reply)

    assert.strictEqual(calls.length, 1)
    assert.ok(calls[0].includes('mês'), `expected "mês" in reply: ${calls[0]}`)
  })

  it('replies with month agenda items when API returns commitments', async () => {
    agendaItemsToReturn = [
      { name: 'Aluguel', amountCents: 150000, date: '2026-03-05' },
      { name: 'Fatura Inter', amountCents: null, date: '2026-03-10' },
    ]
    const context = makeContext()
    const { fn: reply, calls } = makeReply()

    await handleCheckAgendaMonth(context, reply)

    assert.strictEqual(calls.length, 2)
    assert.ok(calls[0].includes('este mês'), `expected "este mês" in: ${calls[0]}`)
    assert.ok(calls[0].includes('Aluguel'), `missing item name: ${calls[0]}`)
  })

  it('calls getAgenda with period="month" and correct userId', async () => {
    const context = makeContext({ userId: 'abc-month' })
    const { fn: reply } = makeReply()

    await handleCheckAgendaMonth(context, reply)

    assert.strictEqual(getAgendaMock.mock.callCount(), 2)
    const args = (getAgendaMock.mock.calls[0] as unknown as { arguments: unknown[] }).arguments
    assert.strictEqual(args[0], 'abc-month')
    assert.strictEqual(args[2], 'month')
  })

  it('replies with an error message when the API throws', async () => {
    throwOnGetAgenda = true
    const context = makeContext()
    const { fn: reply, calls } = makeReply()

    await handleCheckAgendaMonth(context, reply)

    assert.strictEqual(calls.length, 1)
    assert.ok(calls[0].length > 0, 'should reply something on error')
  })
})
