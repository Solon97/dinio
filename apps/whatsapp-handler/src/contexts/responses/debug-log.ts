import { ParsedIntent } from '../intents/types'

/**
 * @temporary This log is sent to WhatsApp to validate AI interpretation during development.
 * It must be removed when persistence is implemented.
 */
export function buildDebugLog(intent: ParsedIntent): string {
  const lines = ['```', 'LOG']

  lines.push(`Intent: ${intent.intent}`)

  if (intent.description != null) lines.push(`Description: ${intent.description}`)
  if (intent.amount != null) lines.push(`Amount: ${intent.amount}`)
  if (intent.category != null) lines.push(`Category: ${intent.category}`)

  lines.push('```')

  return lines.join('\n')
}
