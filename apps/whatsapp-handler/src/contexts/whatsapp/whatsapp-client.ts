const GRAPH_API_BASE_URL = 'https://graph.facebook.com/v21.0'

export interface ListRow {
  id: string
  title: string
  description?: string
}

export interface ListSection {
  title: string
  rows: ListRow[]
}

function getConfig() {
  const token = process.env.WHATSAPP_TOKEN
  const phoneId = process.env.WHATSAPP_PHONE_ID

  if (!token || !phoneId) {
    throw new Error('Missing required env vars: WHATSAPP_TOKEN and/or WHATSAPP_PHONE_ID')
  }

  return { token, phoneId }
}

async function postToWhatsApp(phoneId: string, token: string, payload: unknown): Promise<void> {
  const response = await fetch(`${GRAPH_API_BASE_URL}/${phoneId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`WhatsApp API error ${response.status}: ${errorBody}`)
  }
}

export async function sendTypingIndicator(to: string, messageId: string): Promise<void> {
  try {
    const { token, phoneId } = getConfig()
    await postToWhatsApp(phoneId, token, {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
      typing_indicator: { type: 'text' },
    })
    await new Promise<void>((resolve) => setTimeout(resolve, 1500 + Math.random() * 1000))
  } catch {
    // Silent failure — message delivery must not be blocked
  }
}

export async function sendTextMessage(to: string, body: string): Promise<void> {
  const { token, phoneId } = getConfig()
  await postToWhatsApp(phoneId, token, {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body },
  })
}

/**
 * Sends a WhatsApp interactive button message.
 * WhatsApp supports up to 3 buttons per message.
 * Each button must have a unique `id` (max 256 chars) and a `title` (max 20 chars).
 */
export async function sendButtonMessage(
  to: string,
  body: string,
  buttons: Array<{ id: string; title: string }>,
): Promise<void> {
  const { token, phoneId } = getConfig()
  await postToWhatsApp(phoneId, token, {
    messaging_product: 'whatsapp',
    to,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: body },
      action: {
        buttons: buttons.map((btn) => ({
          type: 'reply',
          reply: { id: btn.id, title: btn.title },
        })),
      },
    },
  })
}

/**
 * Sends a WhatsApp interactive list message.
 * `actionLabel` is the label of the button that opens the list (max 20 chars).
 * Each section can have up to 10 rows; overall limit is 10 rows across all sections.
 */
export async function sendListMessage(
  to: string,
  body: string,
  actionLabel: string,
  sections: ListSection[],
): Promise<void> {
  const { token, phoneId } = getConfig()
  await postToWhatsApp(phoneId, token, {
    messaging_product: 'whatsapp',
    to,
    type: 'interactive',
    interactive: {
      type: 'list',
      body: { text: body },
      action: {
        button: actionLabel,
        sections: sections.map((section) => ({
          title: section.title,
          rows: section.rows.map((row) => ({
            id: row.id,
            title: row.title,
            description: row.description ?? '',
          })),
        })),
      },
    },
  })
}
