-- Add welcome_email_sent_at to profiles for idempotent welcome trial email delivery
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS welcome_email_sent_at timestamptz;
