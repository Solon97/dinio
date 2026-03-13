import { formatBRL, toCurrency } from "@/libs/currency";
import { CreateNotificationInput } from "../../domain/repositories/INotificationRepository";
import { DeliveryChannel } from "../../domain/entities/Notification";

const deliveryChannels: DeliveryChannel[] = ["in_app"];

export interface AgendaItem {
  name: string;
  /** null when amount is unavailable (e.g. credit card invoice totals) */
  amountCents: number | null;
}

export interface DailyNotificationUser {
  userId: string;
  email: string;
  /** null when the user has no budget configured for the current month */
  dailyLimitCents: number | null;
  /** empty when there are no financial commitments due today */
  agendaItems: AgendaItem[];
}

/**
 * Pure function that builds the notification inputs for a single user's daily digest.
 * Returns 0, 1 or 2 items depending on budget and agenda availability.
 */
export function buildDailyNotifications(
  user: DailyNotificationUser,
  date: string,
): CreateNotificationInput[] {
  const notifications: CreateNotificationInput[] = [];

  // Budget alert — only when the user has an active budget for the month
  if (user.dailyLimitCents !== null) {
    const limitStr =
      formatBRL(toCurrency(user.dailyLimitCents)) ??
      `R$ ${(user.dailyLimitCents / 100).toFixed(2)}`;

    notifications.push({
      userId: user.userId,
      type: "budget_alert" as const,
      title: `Seu Teto para hoje: ${limitStr}`,
      message: `Use com consciência para manter seu orçamento no caminho certo.`,
      deliveryChannels,
      recipientEmail: user.email,
      dedupeKey: `${user.userId}:budget_alert:${date}`,
      notificationDate: date,
    });
  }

  // Financial agenda — only when there are commitments due today
  if (user.agendaItems.length > 0) {
    const count = user.agendaItems.length;
    const label = count === 1 ? "compromisso" : "compromissos";
    const displayed = user.agendaItems.slice(0, 5);
    const remaining = count - displayed.length;

    const itemLines = displayed
      .map((item) => {
        const amountStr =
          item.amountCents !== null
            ? ` — ${formatBRL(toCurrency(item.amountCents)) ?? ""}`
            : "";
        return `• ${item.name}${amountStr}`;
      })
      .join("\n");

    const suffix =
      remaining > 0 ? `\n+ ${remaining} outro${remaining > 1 ? "s" : ""}` : "";

    notifications.push({
      userId: user.userId,
      type: "general" as const,
      title: "Agenda financeira",
      message: `Você tem ${count} ${label} para hoje.`,
      deliveryChannels,
      recipientEmail: user.email,
      dedupeKey: `${user.userId}:financial_agenda:${date}`,
      notificationDate: date,
    });
  }

  return notifications;
}
