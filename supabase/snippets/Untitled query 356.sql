WITH
runtime AS (
  SELECT NOW() AS now_utc, CURRENT_DATE AS target_date
),

active_profiles AS (
  SELECT id::text AS user_id, email
  FROM profiles
  WHERE has_access = TRUE
    AND email IS NOT NULL
),

active_users_summary AS (
  SELECT COUNT(*)::int AS active_users_with_email
  FROM active_profiles
),

coverage_by_type AS (
  SELECT type, COUNT(*)::int AS total
  FROM notifications
  WHERE notification_date = CURRENT_DATE
  GROUP BY type
),

coverage_json AS (
  SELECT COALESCE(jsonb_object_agg(type, total), '{}'::jsonb) AS by_type
  FROM coverage_by_type
),

dedupe_duplicates AS (
  SELECT dedupe_key, COUNT(*)::int AS duplicates
  FROM notifications
  WHERE dedupe_key IS NOT NULL
  GROUP BY dedupe_key
  HAVING COUNT(*) > 1
),

dedupe_summary AS (
  SELECT
    COUNT(*)::int AS duplicate_keys_count,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'dedupe_key', dedupe_key,
          'duplicates', duplicates
        )
        ORDER BY duplicates DESC, dedupe_key
      ),
      '[]'::jsonb
    ) AS duplicate_keys_sample
  FROM (
    SELECT dedupe_key, duplicates
    FROM dedupe_duplicates
    ORDER BY duplicates DESC, dedupe_key
    LIMIT 20
  ) d
),

expected_daily_keys AS (
  SELECT user_id, user_id || ':budget_alert:' || CURRENT_DATE::text AS dedupe_key
  FROM active_profiles
  UNION ALL
  SELECT user_id, user_id || ':financial_agenda:' || CURRENT_DATE::text AS dedupe_key
  FROM active_profiles
),

missing_daily AS (
  SELECT e.user_id, e.dedupe_key
  FROM expected_daily_keys e
  LEFT JOIN notifications n
    ON n.dedupe_key = e.dedupe_key
  WHERE n.id IS NULL
),

missing_summary AS (
  SELECT
    COUNT(*)::int AS missing_count,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'user_id', user_id,
          'dedupe_key', dedupe_key
        )
        ORDER BY user_id, dedupe_key
      ),
      '[]'::jsonb
    ) AS missing_sample
  FROM (
    SELECT user_id, dedupe_key
    FROM missing_daily
    ORDER BY user_id, dedupe_key
    LIMIT 50
  ) m
),

queue_status AS (
  SELECT status, COUNT(*)::int AS total
  FROM notifications
  GROUP BY status
),

queue_status_json AS (
  SELECT COALESCE(jsonb_object_agg(status, total), '{}'::jsonb) AS by_status
  FROM queue_status
),

pending_ready AS (
  SELECT COUNT(*)::int AS pending_ready_now
  FROM notifications
  WHERE status = 'pending'
    AND email_sent = FALSE
    AND 'email' = ANY(delivery_channels)
    AND recipient_email IS NOT NULL
    AND (next_retry_at IS NULL OR next_retry_at <= NOW())
),

processing_stuck AS (
  SELECT
    id, user_id, type, processing_started_at,
    (NOW() - processing_started_at) AS processing_age
  FROM notifications
  WHERE status = 'processing'
    AND processing_started_at < NOW() - INTERVAL '15 minutes'
  ORDER BY processing_started_at ASC
),

processing_stuck_summary AS (
  SELECT
    COUNT(*)::int AS stuck_count,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', id,
          'user_id', user_id,
          'type', type,
          'processing_started_at', processing_started_at,
          'processing_age', processing_age
        )
      ),
      '[]'::jsonb
    ) AS stuck_sample
  FROM (
    SELECT *
    FROM processing_stuck
    LIMIT 50
  ) s
),

failed_last_24h AS (
  SELECT
    COUNT(*)::int AS failed_count_24h,
    COALESCE(MAX(email_attempts), 0)::int AS max_attempts_observed
  FROM notifications
  WHERE status = 'failed'
    AND created_at >= NOW() - INTERVAL '24 hours'
),

failed_recent AS (
  SELECT
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', id,
          'user_id', user_id,
          'type', type,
          'email_attempts', email_attempts,
          'last_error', last_error,
          'created_at', created_at,
          'next_retry_at', next_retry_at
        )
        ORDER BY created_at DESC
      ),
      '[]'::jsonb
    ) AS failed_sample
  FROM (
    SELECT id, user_id, type, email_attempts, last_error, created_at, next_retry_at
    FROM notifications
    WHERE status = 'failed'
    ORDER BY created_at DESC
    LIMIT 50
  ) f
),

retry_waiting AS (
  SELECT
    COUNT(*)::int AS pending_waiting_retry_count
  FROM notifications
  WHERE status = 'pending'
    AND email_sent = FALSE
    AND next_retry_at > NOW()
),

retry_waiting_sample AS (
  SELECT
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', id,
          'user_id', user_id,
          'type', type,
          'email_attempts', email_attempts,
          'next_retry_at', next_retry_at,
          'retry_in', (next_retry_at - NOW())
        )
        ORDER BY next_retry_at ASC
      ),
      '[]'::jsonb
    ) AS sample
  FROM (
    SELECT id, user_id, type, email_attempts, next_retry_at
    FROM notifications
    WHERE status = 'pending'
      AND email_sent = FALSE
      AND next_retry_at > NOW()
    ORDER BY next_retry_at ASC
    LIMIT 50
  ) r
),

throughput_last_hour AS (
  SELECT
    COUNT(*)::int AS sent_last_hour,
    COUNT(*) FILTER (WHERE type = 'budget_alert')::int AS sent_budget_alert_last_hour,
    COUNT(*) FILTER (WHERE type = 'general')::int AS sent_general_last_hour
  FROM notifications
  WHERE status = 'sent'
    AND sent_at >= NOW() - INTERVAL '1 hour'
),

recent_timeline AS (
  SELECT
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', id,
          'user_id', user_id,
          'type', type,
          'status', status,
          'email_sent', email_sent,
          'email_attempts', email_attempts,
          'notification_date', notification_date,
          'dedupe_key', dedupe_key,
          'created_at', created_at,
          'processing_started_at', processing_started_at,
          'next_retry_at', next_retry_at,
          'sent_at', sent_at,
          'last_error', last_error
        )
        ORDER BY created_at DESC
      ),
      '[]'::jsonb
    ) AS rows
  FROM (
    SELECT
      id, user_id, type, status, email_sent, email_attempts,
      notification_date, dedupe_key, created_at, processing_started_at,
      next_retry_at, sent_at, last_error
    FROM notifications
    ORDER BY created_at DESC
    LIMIT 100
  ) t
)

SELECT
  r.now_utc,
  r.target_date,
  a.active_users_with_email,
  c.by_type AS today_generation_by_type,
  d.duplicate_keys_count,
  d.duplicate_keys_sample,
  m.missing_count AS missing_daily_notifications_count,
  m.missing_sample AS missing_daily_notifications_sample,
  qs.by_status AS queue_status_snapshot,
  pr.pending_ready_now,
  ps.stuck_count AS processing_stuck_count,
  ps.stuck_sample AS processing_stuck_sample,
  fl.failed_count_24h,
  fl.max_attempts_observed,
  fr.failed_sample AS failed_recent_sample,
  rw.pending_waiting_retry_count,
  rws.sample AS retry_waiting_sample,
  th.sent_last_hour,
  th.sent_budget_alert_last_hour,
  th.sent_general_last_hour,
  rt.rows AS recent_timeline_sample
FROM runtime r
CROSS JOIN active_users_summary a
CROSS JOIN coverage_json c
CROSS JOIN dedupe_summary d
CROSS JOIN missing_summary m
CROSS JOIN queue_status_json qs
CROSS JOIN pending_ready pr
CROSS JOIN processing_stuck_summary ps
CROSS JOIN failed_last_24h fl
CROSS JOIN failed_recent fr
CROSS JOIN retry_waiting rw
CROSS JOIN retry_waiting_sample rws
CROSS JOIN throughput_last_hour th
CROSS JOIN recent_timeline rt;