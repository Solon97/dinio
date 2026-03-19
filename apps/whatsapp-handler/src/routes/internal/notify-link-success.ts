import { FastifyPluginAsync } from 'fastify'
import { sendTextMessage } from '../../contexts/whatsapp/whatsapp-client'

interface NotifyLinkSuccessBody {
  phone_number: string
}

const LINK_SUCCESS_MESSAGE = [
  '🎉 *WhatsApp conectado com sucesso ao seu Dinio!*',
  '',
  'A partir de agora eu sou o seu assistente financeiro aqui no WhatsApp. Você pode me pedir coisas como:',
  '',
  '🛒 *"Gastei 45 no ifood no crédito"*',
  '💰 *"Quanto eu ainda posso gastar esse mês ?"*',
  '🤔 *"Posso gastar 100 reais em uma blusa ?"*',
  '',
  'É só mandar uma mensagem natural, como se estivesse falando com um amigo. Tô aqui pra ajudar! 😊'
].join('\n')

function getInternalSecret(): string {
  const secret = process.env.DINIO_BOT_INTERNAL_SECRET

  if (!secret) {
    throw new Error('Missing required env var: DINIO_BOT_INTERNAL_SECRET')
  }

  return secret
}

const notifyLinkSuccessRoute: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post<{ Body: NotifyLinkSuccessBody }>(
    '/notify-link-success',
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            phone_number: { type: 'string', minLength: 8, maxLength: 32 },
          },
          required: ['phone_number'],
        },
      },
    },
    async (request, reply) => {
      const internalSecret = getInternalSecret()
      const providedSecret = request.headers['x-bot-secret']
      if (providedSecret !== internalSecret) {
        return reply.status(401).send({ error: 'Unauthorized' })
      }

      await sendTextMessage(request.body.phone_number, LINK_SUCCESS_MESSAGE)
      return reply.status(200).send({ delivered: true })
    },
  )
}

export default notifyLinkSuccessRoute
