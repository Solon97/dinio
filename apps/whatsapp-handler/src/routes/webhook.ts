import { FastifyPluginAsync } from 'fastify'
import { extractIncomingMessage } from '../contexts/whatsapp/extract-message'
import { routeMessage } from '../contexts/messaging/message-router'

interface WebhookVerifyQuery {
  'hub.mode': string
  'hub.verify_token': string
  'hub.challenge': string
}

const webhook: FastifyPluginAsync = async (fastify): Promise<void> => {
  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN

  if (!VERIFY_TOKEN) {
    throw new Error('Missing required env var: WHATSAPP_VERIFY_TOKEN')
  }

  /**
   * GET /webhook
   * WhatsApp Cloud API webhook verification handshake.
   */
  fastify.get<{ Querystring: WebhookVerifyQuery }>(
    '/webhook',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            'hub.mode': { type: 'string' },
            'hub.verify_token': { type: 'string' },
            'hub.challenge': { type: 'string' },
          },
          required: ['hub.mode', 'hub.verify_token', 'hub.challenge'],
        },
      },
    },
    async (request, reply) => {
      const mode = request.query['hub.mode']
      const token = request.query['hub.verify_token']
      const challenge = request.query['hub.challenge']

      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        fastify.log.info('WhatsApp webhook verified successfully')
        return reply.status(200).send(challenge)
      }

      fastify.log.warn({ mode, token }, 'WhatsApp webhook verification failed')
      return reply.status(403).send({ error: 'Forbidden' })
    },
  )

  /**
   * POST /webhook
   * Receives incoming WhatsApp events.
   * Returns 200 immediately and processes messages asynchronously.
   */
  fastify.post('/webhook', async (request, reply) => {
    reply.status(200).send()

    setImmediate(async () => {
      try {
        const message = extractIncomingMessage(request.body)

        if (!message) {
          fastify.log.debug('ignored non-text or unrecognised webhook payload')
          return
        }

        await routeMessage(message, fastify.log)
      } catch (err) {
        fastify.log.error({ err }, 'error processing WhatsApp webhook event')
      }
    })
  })
}

export default webhook
