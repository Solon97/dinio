import { sendEmail } from "@/libs/resend";
import { INotificationRepository } from "../../domain/repositories/INotificationRepository";
import {
  AgendaItem,
  buildDailyNotifications,
} from "../helpers/buildDailyNotifications";

export interface ProcessUserDailyNotificationsInput {
  userId: string;
  email: string;
  dailyLimitCents: number | null;
  agendaItems: AgendaItem[];
  date: string;
}

export interface ProcessUserDailyNotificationsResult {
  created: number;
  emailsSent: number;
}

export class ProcessUserDailyNotificationsUseCase {
  constructor(private repository: INotificationRepository) {}

  async execute(
    input: ProcessUserDailyNotificationsInput,
  ): Promise<ProcessUserDailyNotificationsResult> {
    const notificationInputs = buildDailyNotifications(
      {
        userId: input.userId,
        email: input.email,
        dailyLimitCents: input.dailyLimitCents,
        agendaItems: input.agendaItems,
      },
      input.date,
    );

    let created = 0;
    let emailsSent = 0;

    for (const notifInput of notificationInputs) {
      // Try to insert — returns null when dedupe_key already exists (QStash retry scenario)
      let notification = await this.repository.createIfNotExists(notifInput);
      const wasCreated = notification !== null;

      if (!wasCreated && notifInput.dedupeKey) {
        // Notification already exists from a previous attempt — look it up to
        // check if the email was delivered before or after the failure
        notification = await this.repository.findByDedupeKey(
          notifInput.dedupeKey,
        );
      }

      if (!notification) continue;

      if (wasCreated) created += 1;

      // Send email if not yet delivered
      if (
        !notification.emailSent &&
        notification.deliveryChannels.includes("email") &&
        notification.recipientEmail
      ) {
        await sendEmail({
          to: notification.recipientEmail,
          subject: notification.title,
          text: notification.message,
          html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">${notification.title}</h2>
            <p style="color: #555; line-height: 1.6; white-space: pre-line;">${notification.message}</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
            <p style="color: #999; font-size: 12px;">Você recebeu esta mensagem do Dinio. Para gerenciar suas notificações, acesse o aplicativo.</p>
          </div>`,
        });

        await this.repository.markEmailSent(
          notification.id,
          new Date().toISOString(),
        );

        emailsSent += 1;
      }
    }

    return { created, emailsSent };
  }
}
