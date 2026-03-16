import { FastifyBaseLogger } from "fastify";
import { IncomingMessage } from "../../shared/types";
import { parseIntent } from "../ai/intent-parser";
import {
  resolveUserByPhone,
  ResolveUserResponse,
} from "../dinio/dinio-api-client";
import { handleUnknown } from "../intents/handlers/unknown.handler";
import { dispatchIntent } from "../intents/intent-dispatcher";
import { ParsedIntent } from "../intents/types";
import {
  appendToHistory,
  clearOperationState,
  getSession,
  saveSession,
} from "../session/chatSessionStore";
import { buildIntentContext } from "../session/contextBuilder";
import { sendTextMessage } from "../whatsapp/whatsapp-client";
import {
  isMessageRelevant
} from "./relevance-filter";

const LINK_MESSAGE_PREFIX = [
  "Oi! Eu sou o Dinio 👋",
  "Seu assistente para saber quanto pode gastar por dia.",
  "",
  "Pra gente conversar por aqui, primeiro preciso conectar seu WhatsApp à sua conta.",
  "É rápido — leva menos de 1 minuto.",
  "",
  "Toque no link abaixo para fazer a conexão:",
].join("\n");

export async function routeMessage(
  message: IncomingMessage,
  log: FastifyBaseLogger,
): Promise<void> {
  log.info({ messageId: message.messageId }, "routing incoming message");

  let resolveResult: ResolveUserResponse;
  try {
    resolveResult = await resolveUserByPhone(message.phone);
  } catch (error) {
    log.error(
      { err: error, messageId: message.messageId },
      "failed to resolve user by phone",
    );
    await sendTextMessage(
      message.phone,
      [
        "Tive dificuldade para acessar sua conta agora ⚠️",
        "",
        "Tente novamente em alguns instantes que deve funcionar.",
      ].join("\n"),
    );
    return;
  }

  if (!resolveResult.linked) {
    const link = resolveResult.link;
    const responseText = link
      ? `${LINK_MESSAGE_PREFIX}\n\n${link}`
      : [
          "Oi! Eu sou o Dinio 👋",
          "Seu assistente para saber quanto pode gastar por dia.",
          "",
          "Tive um problema para gerar seu link de conexão agora.",
          "",
          "Tente novamente em alguns instantes que deve funcionar.",
        ].join("\n");

    await sendTextMessage(message.phone, responseText);
    log.info({ messageId: message.messageId }, "sent linking message");
    return;
  }

  const userId = resolveResult.user_id;
  if (!userId) {
    await sendTextMessage(
      message.phone,
      [
        "Não consegui identificar sua conta agora ⚠️",
        "",
        "Pode tentar novamente em alguns instantes que eu verifico de novo.",
      ].join("\n"),
    );
    log.warn(
      { messageId: message.messageId },
      "resolve-user returned linked without user_id",
    );
    return;
  }

  let assistantResponse = "";
  const reply = async (text: string): Promise<void> => {
    assistantResponse = text;
    await sendTextMessage(message.phone, text);
  };

  // -------------------------------------------------------------------------
  // Session: single read before any processing
  // -------------------------------------------------------------------------
  const session = await getSession(message.phone);
  
  // -------------------------------------------------------------------------
  // Relevance Filter: quick check before LLM processing.
  // Interactive replies (button/list selections) within an active flow are
  // always relevant and skip this filter entirely.
  // -------------------------------------------------------------------------
  const hasActiveFlow = !!session.state;
  const isInteractiveReply = !!message.interactiveReplyId;

  if (!hasActiveFlow && !isInteractiveReply && !isMessageRelevant(message.text, log)) {
    await handleUnknown(reply);
    log.info(
      { messageId: message.messageId },
      "message rejected by relevance filter",
    );
    return;
  }

  // -------------------------------------------------------------------------
  // Session: snapshot state BEFORE clearing, so handlers can continue flows.
  // -------------------------------------------------------------------------
  const previousState = session.state;
  const previousOperation = session.operation;

  // -------------------------------------------------------------------------
  // Intent detection: LLM receives full context (history + state + message).
  // Short-circuit for interactive replies inside an active register_expense
  // flow — the handler resolves these directly from interactiveReplyId.
  // -------------------------------------------------------------------------
  let intents: ParsedIntent[];
  const isRegisterExpenseInteractive =
    isInteractiveReply && session.state?.intent === 'register_expense';

  if (isRegisterExpenseInteractive) {
    intents = [
      {
        intent: 'register_expense',
        description: null,
        amount: null,
        category: null,
        answer: null,
        expenseDate: null,
        paymentType: null,
        cardNameMention: null,
      },
    ];
  } else {
    const intentContext = buildIntentContext(session, message.text);
    intents = await parseIntent(intentContext);
  }

  log.info({ intents }, "intent(s) parsed");

  // Clear previous operation state before dispatch so handlers start with a
  // clean slate. Handlers that initiate a multi-step flow will re-set state
  // before returning, and that new state will be saved below.
  clearOperationState(session);

  // -------------------------------------------------------------------------
  // Context passed to handlers, including the pre-clear snapshots and a
  // logResponse callback for handlers that send interactive messages.
  // -------------------------------------------------------------------------
  const logResponse = (text: string): void => {
    assistantResponse = text;
  };

  // -------------------------------------------------------------------------
  // Dispatch: capture the handler's response text for history
  // -------------------------------------------------------------------------
  await dispatchIntent(
    intents,
    {
      userId,
      phone: message.phone,
      session,
      previousState,
      previousOperation,
      interactiveReplyId: message.interactiveReplyId ?? null,
      logResponse,
    },
    reply,
  );
  log.info({ messageId: message.messageId }, "response sent");

  // -------------------------------------------------------------------------
  // Session: append turn and save — single write after processing
  // -------------------------------------------------------------------------
  appendToHistory(session, "user", message.text);
  if (assistantResponse) {
    appendToHistory(session, "assistant", assistantResponse);
  }

  await saveSession(message.phone, session);
}
