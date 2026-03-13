import { describe, it } from 'node:test'
import assert from 'node:assert'
import { isMessageRelevant } from '../../src/contexts/messaging/relevance-filter'
import { pino } from 'pino'

const log = pino({ level: 'silent' })

describe('Relevance Filter', () => {
  describe('relevant messages', () => {
    it('should accept messages with expense keywords', () => {
      assert.strictEqual(isMessageRelevant('gastei 50 no uber', log), true)
      assert.strictEqual(isMessageRelevant('despesa de 100 reais', log), true)
      assert.strictEqual(isMessageRelevant('comprei uma pizza', log), true)
      assert.strictEqual(isMessageRelevant('paguei a conta', log), true)
    })

    it('should accept messages with balance/budget keywords', () => {
      assert.strictEqual(isMessageRelevant('quanto posso gastar hoje?', log), true)
      assert.strictEqual(isMessageRelevant('qual meu saldo?', log), true)
      assert.strictEqual(isMessageRelevant('qual meu orçamento?', log), true)
      assert.strictEqual(isMessageRelevant('tenho disponível quanto?', log), true)
    })

    it('should accept messages with numbers (potential amounts)', () => {
      assert.strictEqual(isMessageRelevant('25', log), true)
      assert.strictEqual(isMessageRelevant('coleguei 150', log), true)
      assert.strictEqual(isMessageRelevant('xyz 999', log), true)
    })

    it('should be case-insensitive', () => {
      assert.strictEqual(isMessageRelevant('GASTEI 50', log), true)
      assert.strictEqual(isMessageRelevant('GaStEi 50', log), true)
      assert.strictEqual(isMessageRelevant('QUAL MEU SALDO?', log), true)
    })

    it('should handle whitespace gracefully', () => {
      assert.strictEqual(isMessageRelevant('  gastei 50  ', log), true)
      assert.strictEqual(isMessageRelevant('\n\tgastei 50\n', log), true)
    })
  })

  describe('irrelevant messages', () => {
    it('should reject greeting messages', () => {
      assert.strictEqual(isMessageRelevant('oi tudo bem?', log), false)
      assert.strictEqual(isMessageRelevant('como você está?', log), false)
      assert.strictEqual(isMessageRelevant('qual é seu nome?', log), false)
    })

    it('should reject appreciation messages', () => {
      assert.strictEqual(isMessageRelevant('obrigado', log), false)
      assert.strictEqual(isMessageRelevant('thank you', log), false)
      assert.strictEqual(isMessageRelevant('de nada', log), false)
    })

    it('should reject common conversation fillers', () => {
      assert.strictEqual(isMessageRelevant('ok', log), false)
      assert.strictEqual(isMessageRelevant('tá bom', log), false)
      assert.strictEqual(isMessageRelevant('certo', log), false)
      assert.strictEqual(isMessageRelevant('blz', log), false)
      assert.strictEqual(isMessageRelevant('beleza', log), false)
    })

    it('should reject joke/casual messages', () => {
      assert.strictEqual(isMessageRelevant('haha', log), false)
      assert.strictEqual(isMessageRelevant('rsrs', log), false)
      assert.strictEqual(isMessageRelevant('que piada', log), false)
    })

    it('should reject empty messages', () => {
      assert.strictEqual(isMessageRelevant('', log), false)
      assert.strictEqual(isMessageRelevant('   ', log), false)
      assert.strictEqual(isMessageRelevant('\n', log), false)
    })

    it('should reject completely unrelated messages', () => {
      assert.strictEqual(isMessageRelevant('qual é a capital da França?', log), false)
      assert.strictEqual(isMessageRelevant('me ensina a programar', log), false)
      assert.strictEqual(isMessageRelevant('qual é o resultado do jogo?', log), false)
    })
  })

  describe('edge cases', () => {
    it('should handle messages with partial keyword matches', () => {
      assert.strictEqual(isMessageRelevant('gastar é bom', log), true) // contains "gast"
      assert.strictEqual(isMessageRelevant('estou gastado', log), true) // contains "gast"
    })

    it('should handle messages with numbers but no keywords', () => {
      // This is intentionally ambiguous - we default to true for messages with numbers
      // because they often indicate financial values
      assert.strictEqual(isMessageRelevant('123', log), true)
      assert.strictEqual(isMessageRelevant('999 xyz', log), true)
    })

    it('should handle mixed case keywords', () => {
      assert.strictEqual(isMessageRelevant('Quanto Tenho?', log), true)
      assert.strictEqual(isMessageRelevant('GAST 50', log), true)
    })
  })
})
