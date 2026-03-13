import {
  BotStatusResponse,
  getStatus,
  simulateExpense,
} from "../../dinio/dinio-api-client";
import { formatCurrencyFromCents } from "../../responses/formatters";
import { IntentContext, ReplyFunction, ParsedIntent } from "../types";
import { resolveApiErrorMessage } from "./helpers";

export async function handleSimulateExpense(
  intent: ParsedIntent,
  context: IntentContext,
  reply: ReplyFunction,
): Promise<void> {
  if (intent.amount == null || intent.amount <= 0) {
    // Initiate multi-step flow: persist state so the next message is
    // interpreted as the missing amount for this simulation.
    context.session.state = { intent: "simulate_expense", step: "waiting_amount" }

    await reply(
      [
        "Qual valor você quer simular? 🤔",
        "",
        'Pode mandar algo como: "simula 150".',
      ].join("\n"),
    );
    return;
  }

  // Amount received — clear any waiting state from the previous turn.
  context.session.state = null
  context.session.operation = null

  try {
    await reply("Deixa eu simular esse gasto rapidinho… 📊");
    const currentStatus = await getStatus(context.userId);
    const intentAmountInCents = Math.round(intent.amount * 100);
    const projectedSpend = intentAmountInCents + currentStatus.today_spent;
    const simulatedAmount = formatCurrencyFromCents(intentAmountInCents);
    const isInsideTodayBudget =
      projectedSpend <= currentStatus.recommended_today;

    if (isInsideTodayBudget) {
      await insideTodayBudget(
        {
          projectedSpend,
          currentStatus,
          simulatedAmount,
        },
        reply,
      );
      return;
    }

    const isLastDayOfMonth = currentStatus.days_left <= 0;
    if (isLastDayOfMonth) {
      await reply(
        [
          `Se gastar ${simulatedAmount} agora, você passa do limite que definiu para este mês. ⚠️`,
          "",
          `Hoje é o último dia do mês, e esse gasto está acima do saldo restante (${formatCurrencyFromCents(currentStatus.month_balance)}).`,
          "Se puder, vale deixar esse gasto para o próximo mês.",
        ].join("\n"),
      );
      return;
    }

    const simulation = await simulateExpense({
      userId: context.userId,
      amountInReais: intent.amount,
      description: intent.description ?? undefined,
    });

    const isInsideBudget = simulation.new_month_balance >= 0;
    if (isInsideBudget) {
      //? Se o gasto simulado deixa o mês dentro do orçamento, a mensagem é mais tranquila, falando do impacto no saldo do mês e no valor recomendado para os próximos dias.
      const guidanceMessage =
        simulation.new_projection < 0
          ? `Você pode gastar ${simulatedAmount}, mas deve ter cuidado nos próximos dias. ⚠️`
          : `Você pode gastar ${simulatedAmount} com tranquilidade 👍`;

      const projectionMessage =
        simulation.new_projection < 0
          ? `⚠️ Se mantiver esse ritmo, no fim do mês você precisaria completar com ${formatCurrencyFromCents(Math.abs(simulation.new_projection))} da sua reserva.`
          : `💰 Se mantiver esse ritmo, você pode terminar o mês com +${formatCurrencyFromCents(simulation.new_projection)} na sua reserva.`;

      await reply(
        [
          guidanceMessage,
          `Depois desse gasto, seu saldo disponível no mês ficaria em ${formatCurrencyFromCents(simulation.new_month_balance)}.`,
          `Sua média recomendada por dia passaria de ${formatCurrencyFromCents(currentStatus.recommended_today)} para ${formatCurrencyFromCents(simulation.new_future_recommendation)}.\n\n`,
          projectionMessage,
        ].join("\n"),
      );
      return;
    }
    //? Se o gasto simulado deixa o mês no negativo, é porque ele ultrapassa o limite que o usuário definiu para o mês.
    //? A mensagem é de alerta, sem falar do valor recomendado para os próximos dias, já que o usuário teria que cortar todos os gastos para não estourar o limite do mês.
    await reply(
      [
        `Se gastar ${simulatedAmount} agora, você passa do limite que definiu para este mês. ⚠️`,
        "",
        `Depois desse gasto, seu saldo do mês ficaria em ${formatCurrencyFromCents(simulation.new_month_balance)}.`,
        "Na prática, não sobraria valor disponível para os próximos dias deste mês.",
        "",
        "Se puder, vale deixar esse gasto para o próximo mês.",
      ].join("\n"),
    );
  } catch (error) {
    await reply(resolveApiErrorMessage(error, "simulate"));
  }
}

async function insideTodayBudget(
  {
    projectedSpend,
    currentStatus,
    simulatedAmount,
  }: {
    projectedSpend: number;
    currentStatus: BotStatusResponse;
    simulatedAmount: string;
  },
  reply: ReplyFunction,
) {
  const conclusionMessage = `Esse gasto de ${simulatedAmount} cabe na sua média recomendada de hoje ✅\n\n`;
  const todaySpentMessage =
    currentStatus.today_spent > 0
      ? `Hoje você já gastou ${formatCurrencyFromCents(currentStatus.today_spent)}.\n`
      : "";

  let message =
    conclusionMessage +
    todaySpentMessage +
    `Com esse gasto de ${simulatedAmount}, o total do dia iria para ${formatCurrencyFromCents(projectedSpend)}.` +
    `\nSua média recomendada para hoje é ${formatCurrencyFromCents(currentStatus.recommended_today)}`;

  await reply(message);
}
