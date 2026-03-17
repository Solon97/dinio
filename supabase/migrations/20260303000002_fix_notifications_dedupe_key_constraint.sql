-- Fix: replace partial unique index with a full UNIQUE constraint on dedupe_key.
--
-- The partial index (WHERE dedupe_key IS NOT NULL) is incompatible with
-- PostgREST's ON CONFLICT (dedupe_key) DO NOTHING clause, which requires
-- either a UNIQUE constraint or a non-partial unique index.
-- PostgreSQL raises "no unique or exclusion constraint matching the ON CONFLICT
-- specification" when only a partial index exists.
--
-- A full UNIQUE constraint still allows multiple NULL dedupe_keys because
-- PostgreSQL treats each NULL as distinct (NULL ≠ NULL), so rows without a
-- dedupe_key are not affected.

DROP INDEX IF EXISTS idx_notifications_dedupe_key;

ALTER TABLE notifications
  ADD CONSTRAINT notifications_dedupe_key_unique UNIQUE (dedupe_key);
