import { OpenRouter } from '@openrouter/sdk'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

function createClient() {
  const apiKey = process.env.OPENROUTER_API_KEY

  if (!apiKey) {
    throw new Error('Missing required env var: OPENROUTER_API_KEY')
  }

  return new OpenRouter({ apiKey })
}

function loadPrompt(filename: string): string {
  return readFileSync(join(process.cwd(), 'prompts', filename), 'utf-8')
}

export async function callAI(userMessage: string, promptFile: string): Promise<string> {
  const client = createClient()
  const instructions = loadPrompt(promptFile)
  const model = process.env.AI_MODEL ?? 'google/gemini-2.5-flash-lite'

  const result = client.callModel({
    model,
    instructions,
    input: userMessage,
  })

  return result.getText()
}
