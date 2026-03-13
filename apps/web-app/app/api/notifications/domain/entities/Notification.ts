export type NotificationType =
  | "budget_alert"
  | "payment_reminder"
  | "weekly_summary"
  | "general";

export type DeliveryChannel = "in_app" | "email";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  deliveryChannels: DeliveryChannel[];
  recipientEmail?: string | null;
  emailSent: boolean;
  read: boolean;
  referenceId?: string | null;
  dedupeKey?: string | null;
  notificationDate?: string | null;
  createdAt: string;
}
