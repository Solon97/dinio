import { IntentContext, ReplyFunction } from '../types'

export async function handleCancelOperation(
  context: IntentContext,
  reply: ReplyFunction,
): Promise<void> {
  const hasActiveOperation =
    context.previousState !== null || context.previousOperation !== null

  if (hasActiveOperation) {
    await reply(
      [
        'Operacao cancelada. Tudo certo ✅',
        '',
        'Se quiser, me envie uma nova mensagem que eu te ajudo de novo.',
      ].join('\n'),
    )
    return
  }

  await reply(
    [
      'Nao havia nenhuma operacao em andamento para cancelar.',
      '',
      'Quando quiser, me manda um gasto ou uma consulta e eu continuo daqui 👌',
    ].join('\n'),
  )
}
