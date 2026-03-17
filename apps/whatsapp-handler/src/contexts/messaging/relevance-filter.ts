import { FastifyBaseLogger } from "fastify";

/**
 * Keywords that indicate a message is relevant to Dinio's financial context.
 * Used for quick pre-filtering before sending to LLM.
 */
const DINIO_KEYWORDS = [
  // Finance & Money
  "gast", // gastei, gastos, gastar, gasta, etc
  "despesa",
  "ganh", // ganhei, ganhar, ganhos
  "renda",
  "receita",
  "saldo",
  "mês",
  "dia",
  "orçamento",
  "limite",
  "custo",
  "cobr", // cobrei, cobrança
  "pag", // paguei, pagar, pagamento
  "compr", // comprei, comprar, compra
  "preço",
  "valor",
  "reais",
  "real",
  "débito",
  "crédito",
  "cartão",
  "transferência",
  "dinheiro",
  "grana",
  "quanto", // common user question indicating financial context
  "agenda",
  "simula",
  "registr",
  "anot",
  "reembolso",
  "estorno",
  "devolver",
  "devolveram",
  "sim",
  "não",
];

/**
 * Checks if a message is relevant to Dinio's financial context.
 *
 * Uses a two-stage filter:
 * 1. Quick keyword-based check (rejects clearly off-topic messages)
 * 2. Returns true if keywords match or if message contains numbers (potential financial context)
 *
 * This is a pre-filter before LLM processing. The LLM will still classify as "unknown"
 * if the message is actually irrelevant despite passing this filter.
 */
export function isMessageRelevant(
  messageText: string,
  log: FastifyBaseLogger,
): boolean {
  const normalized = messageText.toLowerCase().trim();

  // Reject empty messages
  if (!normalized.length) {
    return false;
  }

  // Check for Dinio-relevant keywords
  for (const keyword of DINIO_KEYWORDS) {
    if (normalized.includes(keyword)) {
      log.debug(
        { messageText, matchedKeyword: keyword },
        "message accepted by keyword filter",
      );
      return true;
    }
  }

  // Check for numbers (often indicate expense amounts)
  const hasNumbers = /\d+/.test(normalized);
  if (hasNumbers) {
    log.debug({ messageText }, "message accepted by number detection");
    return true;
  }

  // If no keywords and no numbers match, likely not relevant
  log.debug(
    { messageText },
    "message rejected: no relevant keywords or numbers found",
  );
  return false;
}

/**
 * Response message when a message is not relevant to Dinio's context.
 * Friendly, judgment-free, and guides the user back to Dinio's purpose.
 */
export const IRRELEVANT_MESSAGE_RESPONSE = [
  "Oi! Sou o assistente financeiro do Dinio 💰",
  "",
  "Eu sou especializado em ajudar você a controlar gastos, checar seu saldo diário e registrar despesas.",
  "",
  "Tente me enviar algo como:",
  '• "Gastei 50 no uber"',
  '• "Quanto posso gastar hoje?"',
  '• "Qual meu saldo?"',
].join("\n");
