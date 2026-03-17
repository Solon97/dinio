import { getCreditCards, registerExpense } from "../../dinio/dinio-api-client";
import { formatCurrencyFromCents } from "../../responses/formatters";
import type { PendingCardInfo, PendingExpenseData } from "../../session/types";
import {
  sendButtonMessage,
  sendListMessage,
} from "../../whatsapp/whatsapp-client";
import { ParsedIntent, IntentContext, ReplyFunction } from "../types";
import {
  buildConfirmationText,
  capitalizeFirst,
  computeInvoiceDueMonthId,
  inferPaymentType,
  mapIntentCategoryToApiCategory,
  matchCardByName,
  resolveApiErrorMessage,
  resolveExpenseDate,
} from "./helpers";

const CONFIRM_BUTTON_ID = "confirm_expense";
const CONFIRM_BUTTON_TITLE = "Confirmar ✅";

// ---------------------------------------------------------------------------
// Step identifiers for the register_expense multi-turn flow
// ---------------------------------------------------------------------------

const STEP_AWAITING_CONFIRMATION = "awaiting_confirmation";
const STEP_CARD_SELECTION_REQUIRED = "card_selection_required";

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export async function handleRegisterExpense(
  intent: ParsedIntent,
  context: IntentContext,
  reply: ReplyFunction,
): Promise<void> {
  const { previousState, previousOperation, interactiveReplyId } = context;
  const pendingData = previousOperation?.data as PendingExpenseData | undefined;

  if (!!previousState && !!pendingData && interactiveReplyId) {
    return handleInteractiveReply(
      context,
      reply,
      previousState.step,
      pendingData,
    );
  }

  return startNewExpenseFlow(intent, context, reply);
}

async function handleInteractiveReply(
  context: IntentContext,
  reply: ReplyFunction,
  previousStep: string,
  pendingData: PendingExpenseData,
): Promise<void> {
  if (previousStep === STEP_CARD_SELECTION_REQUIRED) {
    return handleCardSelection(pendingData, context, reply);
  }

  if (
    previousStep === STEP_AWAITING_CONFIRMATION &&
    context.interactiveReplyId === CONFIRM_BUTTON_ID
  ) {
    return persistExpense(pendingData, context, reply);
  }
}

// ---------------------------------------------------------------------------
// Step: start a new expense flow from a fresh intent
// ---------------------------------------------------------------------------

async function startNewExpenseFlow(
  intent: ParsedIntent,
  context: IntentContext,
  reply: ReplyFunction,
): Promise<void> {
  if (intent.amount == null || intent.amount <= 0) {
    await reply(
      [
        "Não peguei o valor desse gasto 💸",
        "",
        "Me manda o valor que eu registro para você.",
      ].join("\n"),
    );
    return;
  }

  const date = resolveExpenseDate(intent.expenseDate);
  if (!date) {
    await reply(
      [
        "Não consegui entender a data desse gasto 📅",
        "",
        'Me manda no formato dia/mês/ano, por exemplo: "10/03/2026".',
      ].join("\n"),
    );
    return;
  }

  const description = capitalizeFirst((intent.description ?? "gasto").trim());
  const category = mapIntentCategoryToApiCategory(intent.category);
  const paymentType = inferPaymentType(
    intent.paymentType,
    intent.cardNameMention,
  );

  const pendingExpense: PendingExpenseData = {
    description,
    amountInReais: intent.amount,
    category,
    date,
    paymentType,
    isRefund: intent.isRefund ?? false,
  };

  if (paymentType === "credito") {
    await resolveCardForExpense(
      pendingExpense,
      intent.cardNameMention,
      context,
      reply,
    );
    return;
  }

  await transitionToConfirmation(pendingExpense, context);
}

// ---------------------------------------------------------------------------
// Step: resolve card when paymentType is credit
// ---------------------------------------------------------------------------

async function resolveCardForExpense(
  pendingExpense: PendingExpenseData,
  cardNameMention: string | null,
  context: IntentContext,
  reply: ReplyFunction,
): Promise<void> {
  let cards: PendingCardInfo[];
  try {
    cards = await getCreditCards(context.userId);
  } catch {
    await reply(resolveApiErrorMessage(null, "register"));
    return;
  }

  if (cards.length === 0) {
    await reply(
      [
        "Você não tem cartões de crédito cadastrados no Dinio 💳",
        "",
        "Para registrar gastos no crédito, primeiro adicione seu cartão no app do Dinio.",
        "Depois é só voltar aqui e tentar de novo 👍",
      ].join("\n"),
    );
    return;
  }

  if (cardNameMention) {
    const matched = matchCardByName(cards, cardNameMention);
    if (matched) {
      pendingExpense.card = matched;
      pendingExpense.invoiceDueMonthId = computeInvoiceDueMonthId(
        pendingExpense.date,
        matched.dueDay,
        matched.closingDay,
      );
      await transitionToConfirmation(pendingExpense, context);
      return;
    }
  }

  // No match or ambiguous — ask user to pick from list
  pendingExpense.availableCards = cards;
  await transitionToCardSelection(pendingExpense, context);
}

// ---------------------------------------------------------------------------
// Step: card selection via interactive list reply
// ---------------------------------------------------------------------------

async function handleCardSelection(
  pendingData: PendingExpenseData,
  context: IntentContext,
  reply: ReplyFunction,
): Promise<void> {
  const { interactiveReplyId } = context;
  const availableCards = pendingData.availableCards ?? [];

  if (!interactiveReplyId) {
    // User sent text instead of selecting from list — re-send the list
    await transitionToCardSelection(pendingData, context);
    return;
  }

  const selectedCard = availableCards.find((c) => c.id === interactiveReplyId);
  if (!selectedCard) {
    await reply(
      "Não reconheci essa seleção 🤔 Escolha um dos cartões da lista abaixo.",
    );
    await transitionToCardSelection(pendingData, context);
    return;
  }

  const updatedExpense: PendingExpenseData = {
    ...pendingData,
    card: selectedCard,
    invoiceDueMonthId: computeInvoiceDueMonthId(
      pendingData.date,
      selectedCard.dueDay,
      selectedCard.closingDay,
    ),
  };

  await transitionToConfirmation(updatedExpense, context);
}

// ---------------------------------------------------------------------------
// Step: persist the confirmed expense via API
// ---------------------------------------------------------------------------

async function persistExpense(
  pendingData: PendingExpenseData,
  context: IntentContext,
  reply: ReplyFunction,
): Promise<void> {
  try {
    const amountInReais = pendingData.isRefund
      ? -Math.abs(pendingData.amountInReais)
      : pendingData.amountInReais;

    const apiResponse = await registerExpense({
      userId: context.userId,
      description: pendingData.description,
      amountInReais,
      category: pendingData.category,
      date: pendingData.date,
      creditCardId: pendingData.card?.id,
      invoiceDueMonthId: pendingData.invoiceDueMonthId,
    });

    const amountDisplay = formatCurrencyFromCents(Math.round(pendingData.amountInReais * 100));

    if (pendingData.isRefund) {
      await reply(
        [
          "Pronto! 💚",
          "",
          `Já anotei o reembolso de ${amountDisplay} de ${capitalizeFirst(pendingData.description)}.`,
          `Hoje você já gastou ${formatCurrencyFromCents(apiResponse.today_spent)} e ainda tem ${formatCurrencyFromCents(apiResponse.month_balance)} no mês.`,
          `Seu valor mais seguro para hoje ficou em ${formatCurrencyFromCents(apiResponse.recommended_today)} 👍`,
        ].join("\n"),
      );
    } else {
      await reply(
        [
          "Pronto! 💸",
          "",
          `Já anotei os ${amountDisplay} de ${capitalizeFirst(pendingData.description)}.`,
          `Hoje você já gastou ${formatCurrencyFromCents(apiResponse.today_spent)} e ainda tem ${formatCurrencyFromCents(apiResponse.month_balance)} no mês.`,
          `Seu valor mais seguro para hoje ficou em ${formatCurrencyFromCents(apiResponse.recommended_today)} 👍`,
        ].join("\n"),
      );
    }
  } catch (error) {
    await reply(resolveApiErrorMessage(error, "register"));
  }
}

// ---------------------------------------------------------------------------
// Transition helpers — set session state and send interactive messages
// ---------------------------------------------------------------------------

async function transitionToConfirmation(
  pending: PendingExpenseData,
  context: IntentContext,
): Promise<void> {
  context.session.state = {
    intent: "register_expense",
    step: STEP_AWAITING_CONFIRMATION,
  };
  context.session.operation = {
    type: "register_expense",
    data: pending as unknown as Record<string, unknown>,
  };

  const confirmationText = buildConfirmationText(pending);
  await sendButtonMessage(context.phone, confirmationText, [
    { id: CONFIRM_BUTTON_ID, title: CONFIRM_BUTTON_TITLE },
  ]);
}

async function transitionToCardSelection(
  pending: PendingExpenseData,
  context: IntentContext,
): Promise<void> {
  context.session.state = {
    intent: "register_expense",
    step: STEP_CARD_SELECTION_REQUIRED,
  };
  context.session.operation = {
    type: "register_expense",
    data: pending as unknown as Record<string, unknown>,
  };

  const cards = pending.availableCards ?? [];
  const bodyText = [
    "Qual cartão de crédito você quer usar? 💳",
    "",
    "Selecione um dos cartões abaixo:",
  ].join("\n");

  await sendListMessage(context.phone, bodyText, "Ver cartões", [
    {
      title: "Meus cartões",
      rows: cards.map((card) => ({
        id: card.id,
        title: card.name,
        description: "",
      })),
    },
  ]);
}
