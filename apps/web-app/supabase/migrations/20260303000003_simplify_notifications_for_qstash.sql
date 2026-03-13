-- Simplify notifications table for QStash-based architecture.
--
-- The previous batch-processing model required several columns to manage
-- an in-database job queue (status, retry counters, locks). With QStash,
-- retry logic and delivery tracking are handled externally, so these columns
-- are no longer needed.
--
-- email_sent is kept: it acts as an idempotency flag so that QStash retries
-- do not re-send an email that was already delivered.

ALTER TABLE notifications
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS email_attempts,
  DROP COLUMN IF EXISTS next_retry_at,
  DROP COLUMN IF EXISTS last_error,
  DROP COLUMN IF EXISTS processing_started_at;

-- The email queue index was only useful for the batch claim query.
DROP INDEX IF EXISTS idx_notifications_email_queue;
