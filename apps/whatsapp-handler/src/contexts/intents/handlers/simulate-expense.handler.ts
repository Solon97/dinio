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
      //? O gasto ultrapassa a média recomendada de hoje, mas o orçamento do mês ainda aguenta.
      //? A mensagem foca no impacto na média diária dos próximos dias.
      await reply(
        [
          `⚠️ Esse gasto de ${simulatedAmount} está acima da sua média recomendada para hoje (${formatCurrencyFromCents(currentStatus.recommended_today)}).`,
          "",
          `Para ficar dentro do limite, você precisará gastar em média ${formatCurrencyFromCents(simulation.new_future_recommendation)} por dia nos próximos ${currentStatus.days_left} dias do mês.`,
        ].join("\n"),
      );
      return;
    }
    //? O gasto simulado deixa o mês no negativo — ultrapassa o limite mensal definido pelo usuário.
    //? Alerta mais grave: mostra o saldo negativo que resultaria.
    await reply(
      [
        `🚨 Cuidado! Se gastar ${simulatedAmount} agora, você vai estourar o limite que definiu para este mês.`,
        "",
        `Seu saldo ficaria em ${formatCurrencyFromCents(simulation.new_month_balance)} — você entraria no negativo.`,
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
