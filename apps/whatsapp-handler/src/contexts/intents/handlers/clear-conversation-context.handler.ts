import { IntentContext, ReplyFunction } from '../types'
import { clearOperationState } from '../../session/chatSessionStore'

export async function handleClearConversationContext(
  context: IntentContext,
  reply: ReplyFunction,
): Promise<void> {
  clearOperationState(context.session)
  context.session.history = []

  await reply(
    [
      'Contexto da conversa limpo com sucesso 🧹',
      '',
      'Podemos recomecar do zero. Me diga o que voce quer fazer agora.',
    ].join('\n'),
  )
}
