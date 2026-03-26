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
    const currentStatus = await getStatus(context.userId);
    const intentAmountInCents = Math.round(intent.amount * 100);
    const projectedSpend = intentAmountInCents + currentStatus.today_spent;
    const isInsideTodayBudget =
      projectedSpend <= currentStatus.recommended_today;

    if (isInsideTodayBudget) {
      await insideTodayBudget({ projectedSpend, currentStatus }, reply);
      return;
    }

    const simulation = await simulateExpense({
      userId: context.userId,
      amountInReais: intent.amount,
      description: intent.description ?? undefined,
    });

    const isInsideBudget = simulation.new_month_balance >= 0;
    if (isInsideBudget) {
      await reply(
        [
          `Com esse gasto, o total do dia iria para ${formatCurrencyFromCents(projectedSpend)} — acima do teto de ${formatCurrencyFromCents(currentStatus.recommended_today)}.`,
          `Você ainda tem ${formatCurrencyFromCents(simulation.new_month_balance)} no mês e o teto dos próximos dias cairia para ${formatCurrencyFromCents(simulation.new_future_recommendation)}.`,
        ].join("\n"),
      );
      return;
    }

    await reply(
      [
        `Com esse gasto, o total do dia iria para ${formatCurrencyFromCents(projectedSpend)} — acima do teto de ${formatCurrencyFromCents(currentStatus.recommended_today)}.`,
        `Se gastar agora, o mês fecha no negativo em ${formatCurrencyFromCents(Math.abs(simulation.new_month_balance))}.`,
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
  }: {
    projectedSpend: number;
    currentStatus: BotStatusResponse;
  },
  reply: ReplyFunction,
) {
  await reply(
    `Com esse gasto, você teria usado ${formatCurrencyFromCents(projectedSpend)} dos ${formatCurrencyFromCents(currentStatus.recommended_today)} de hoje — dentro do teto. 💚`,
  );
}
