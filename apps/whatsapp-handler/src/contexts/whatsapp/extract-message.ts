import { IncomingMessage } from '../../shared/types'

function extractTextMessage(message: Record<string, unknown>): IncomingMessage | null {
  const text = message.text as Record<string, string> | undefined
  if (!text?.body) return null

  return {
    phone: message.from as string,
    text: text.body,
    messageId: message.id as string,
  }
}

function extractInteractiveMessage(message: Record<string, unknown>): IncomingMessage | null {
  const interactive = message.interactive as Record<string, unknown> | undefined
  if (!interactive) return null

  const interactiveType = interactive.type as string | undefined

  if (interactiveType === 'button_reply') {
    const reply = interactive.button_reply as Record<string, string> | undefined
    if (!reply?.id || !reply?.title) return null

    return {
      phone: message.from as string,
      text: reply.title,
      messageId: message.id as string,
      interactiveReplyId: reply.id,
    }
  }

  if (interactiveType === 'list_reply') {
    const reply = interactive.list_reply as Record<string, string> | undefined
    if (!reply?.id || !reply?.title) return null

    return {
      phone: message.from as string,
      text: reply.title,
      messageId: message.id as string,
      interactiveReplyId: reply.id,
    }
  }

  return null
}

export function extractIncomingMessage(payload: unknown): IncomingMessage | null {
  try {
    const body = payload as Record<string, unknown>
    const entry = (body?.entry as unknown[])?.[0] as Record<string, unknown>
    const change = (entry?.changes as unknown[])?.[0] as Record<string, unknown>
    const value = change?.value as Record<string, unknown>
    const message = (value?.messages as unknown[])?.[0] as Record<string, unknown>

    if (!message) return null

    if (message.type === 'text') return extractTextMessage(message)
    if (message.type === 'interactive') return extractInteractiveMessage(message)

    return null
  } catch {
    return null
  }
}
