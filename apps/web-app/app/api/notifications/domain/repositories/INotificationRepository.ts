import { Notification } from "../entities/Notification";

export interface CreateNotificationInput {
  userId: string;
  type: Notification["type"];
  title: string;
  message: string;
  deliveryChannels: Notification["deliveryChannels"];
  recipientEmail?: string | null;
  referenceId?: string | null;
  dedupeKey?: string | null;
  notificationDate?: string | null;
}

export interface INotificationRepository {
  create(input: CreateNotificationInput): Promise<Notification>;
  createIfNotExists(
    input: CreateNotificationInput,
  ): Promise<Notification | null>;
  findById(id: string, userId: string): Promise<Notification | null>;
  findByDedupeKey(key: string): Promise<Notification | null>;
  findByUser(
    userId: string,
    options?: { unreadOnly?: boolean; limit?: number },
  ): Promise<Notification[]>;
  markAsRead(id: string, userId: string): Promise<void>;
  markEmailSent(id: string, sentAt: string): Promise<void>;
  countUnread(userId: string): Promise<number>;
}
