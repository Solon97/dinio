import { ParsedIntent, ReplyFunction } from '../types'
import { handleUnknown } from './unknown.handler'

export async function handleAnswerFromHistory(
  intent: ParsedIntent,
  reply: ReplyFunction,
): Promise<void> {
  if (!intent.answer) {
    return handleUnknown(reply)
  }

  await reply(intent.answer)
}
