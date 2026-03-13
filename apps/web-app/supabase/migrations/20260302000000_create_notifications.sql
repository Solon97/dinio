-- Create notifications table
-- Stores in-app and email notifications for users.
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('budget_alert', 'payment_reminder', 'weekly_summary', 'general')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  delivery_channels TEXT[] NOT NULL DEFAULT '{in_app}',
  email_sent BOOLEAN NOT NULL DEFAULT FALSE,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  reference_id TEXT,
  scheduled_for TIMESTAMPTZ, -- when the notification should be delivered (null = immediate)
  sent_at TIMESTAMPTZ,       -- when the email was actually sent (null = not yet sent)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookups by user (most common query)
CREATE INDEX idx_notifications_user_id
  ON notifications (user_id, created_at DESC);

-- Index for unread notifications per user
CREATE INDEX idx_notifications_user_unread
  ON notifications (user_id, read)
  WHERE read = FALSE;

-- Index for scheduled notifications not yet sent
CREATE INDEX idx_notifications_scheduled
  ON notifications (scheduled_for)
  WHERE sent_at IS NULL AND scheduled_for IS NOT NULL;

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
