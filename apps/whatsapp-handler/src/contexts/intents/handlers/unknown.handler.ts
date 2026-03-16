import { ReplyFunction } from "../types";

export async function handleUnknown(reply: ReplyFunction): Promise<void> {
  await reply(
    [
      "Não consegui entender essa mensagem 🤔",
      "",
      "Posso registrar gasto, dizer quanto você pode usar hoje ou simular uma compra.",
      "Tente me enviar algo como:",
      '• "Gastei 50 no uber"',
      '• "Quanto posso gastar hoje?"',
      '• "Qual meu saldo para o mês ?"',
      '• "Simula uma compra de 30 reais"',
      '• "Tenho compromissos hoje?"',
      '• "Tenho compromissos nesta semana?"',
      '• "Tenho compromissos neste mês?"',
    ].join("\n"),
  );
}
