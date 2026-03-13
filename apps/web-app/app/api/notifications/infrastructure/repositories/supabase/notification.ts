import { SupabaseClient } from "@supabase/supabase-js";
import {
  DeliveryChannel,
  Notification,
  NotificationType,
} from "../../../domain/entities/Notification";
import {
  CreateNotificationInput,
  INotificationRepository,
} from "../../../domain/repositories/INotificationRepository";

interface NotificationRow {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  delivery_channels: DeliveryChannel[];
  recipient_email: string | null;
  email_sent: boolean;
  read: boolean;
  reference_id: string | null;
  dedupe_key: string | null;
  notification_date: string | null;
  created_at: string;
}

// Supabase PostgREST error code for "row not found"
const POSTGRES_NOT_FOUND_CODE = "PGRST116";
const POSTGRES_UNIQUE_VIOLATION_CODE = "23505";

function mapRow(row: NotificationRow): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    message: row.message,
    deliveryChannels: row.delivery_channels,
    recipientEmail: row.recipient_email,
    emailSent: row.email_sent,
    read: row.read,
    referenceId: row.reference_id,
    dedupeKey: row.dedupe_key,
    notificationDate: row.notification_date,
    createdAt: row.created_at,
  };
}

export class SupabaseNotificationRepository implements INotificationRepository {
  constructor(private supabase: SupabaseClient) {}

  async create(input: CreateNotificationInput): Promise<Notification> {
    const { data, error } = await this.supabase
      .from("notifications")
      .insert({
        user_id: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        delivery_channels: input.deliveryChannels,
        recipient_email: input.recipientEmail ?? null,
        reference_id: input.referenceId ?? null,
        dedupe_key: input.dedupeKey ?? null,
        notification_date: input.notificationDate ?? null,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to create notification: ${error?.message}`);
    }

    return mapRow(data as NotificationRow);
  }

  async createIfNotExists(
    input: CreateNotificationInput,
  ): Promise<Notification | null> {
    const { data, error } = await this.supabase
      .from("notifications")
      .insert({
        user_id: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        delivery_channels: input.deliveryChannels,
        recipient_email: input.recipientEmail ?? null,
        reference_id: input.referenceId ?? null,
        dedupe_key: input.dedupeKey ?? null,
        notification_date: input.notificationDate ?? null,
      })
      .select()
      .single();

    if (error?.code === POSTGRES_UNIQUE_VIOLATION_CODE) {
      return null;
    }

    if (error || !data) {
      throw new Error(`Failed to create notification: ${error?.message}`);
    }

    return mapRow(data as NotificationRow);
  }

  async findById(id: string, userId: string): Promise<Notification | null> {
    const { data, error } = await this.supabase
      .from("notifications")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error && error.code !== POSTGRES_NOT_FOUND_CODE) {
      throw new Error(`Failed to fetch notification: ${error.message}`);
    }

    if (!data) return null;

    return mapRow(data as NotificationRow);
  }

  async findByDedupeKey(key: string): Promise<Notification | null> {
    const { data, error } = await this.supabase
      .from("notifications")
      .select("*")
      .eq("dedupe_key", key)
      .single();

    if (error && error.code !== POSTGRES_NOT_FOUND_CODE) {
      throw new Error(
        `Failed to fetch notification by dedupe key: ${error.message}`,
      );
    }

    if (!data) return null;

    return mapRow(data as NotificationRow);
  }

  async findByUser(
    userId: string,
    options?: { unreadOnly?: boolean; limit?: number },
  ): Promise<Notification[]> {
    let query = this.supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(options?.limit ?? 50);

    if (options?.unreadOnly) {
      query = query.eq("read", false);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch notifications: ${error.message}`);
    }

    return (data as NotificationRow[]).map(mapRow);
  }

  async markAsRead(id: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to mark notification as read: ${error.message}`);
    }
  }

  async markEmailSent(id: string, sentAt: string): Promise<void> {
    const { error } = await this.supabase
      .from("notifications")
      .update({
        email_sent: true,
        sent_at: sentAt,
      })
      .eq("id", id);

    if (error) {
      throw new Error(`Failed to mark email as sent: ${error.message}`);
    }
  }

  async countUnread(userId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("read", false);

    if (error) {
      throw new Error(`Failed to count unread notifications: ${error.message}`);
    }

    return count ?? 0;
  }
}
