-- RPC: get_notification_budget_context
--
-- Replaces the 4 parallel PostgREST queries in fetchBudgetContext.ts with a
-- single POST call, eliminating the URL-length problem caused by large
-- IN (uuid, uuid, ...) clauses in HTTP GET requests.
--
-- nginx default limit is 8 KB; 1 000 UUIDs alone occupy ~36 KB. Any SaaS with
-- more than ~200 active users would hit "414 URI Too Long" with GET queries.
-- RPC calls use HTTP POST (JSON body), so there is no URL-length constraint.
--
-- Returns a single JSONB object with four pre-computed datasets:
--   budget_configs       – monthly budget settings per user
--   expense_agg          – daily expense sums needed for the dynamic limit
--   fixed_expenses_today – non-card fixed expenses due today
--   invoices_today       – credit-card invoices due today

CREATE OR REPLACE FUNCTION get_notification_budget_context(
  p_user_ids UUID[],
  p_month_id INTEGER,
  p_today    DATE
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT jsonb_build_object(

    -- 1. Budget configs (1 row per user at most)
    'budget_configs', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'user_id',                user_id,
        'total_income',           total_income,
        'daily_percent',          daily_percent,
        'remaining_daily_budget', remaining_daily_budget,
        'start_day',              start_day
      )), '[]'::jsonb)
      FROM monthly_budgets
      WHERE user_id = ANY(p_user_ids)
        AND month_id = p_month_id
    ),

    -- 2. Daily expense aggregates (1 row per user, SUM done in Postgres)
    --    start_day is respected: expenses before budget setup are excluded.
    'expense_agg', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'user_id',          agg.user_id,
        'spent_before',     agg.spent_before,
        'future_committed', agg.future_committed
      )), '[]'::jsonb)
      FROM (
        SELECT
          de.user_id,
          coalesce(sum(de.amount) FILTER (
            WHERE de.date >= make_date(
                    extract(year  FROM p_today)::int,
                    extract(month FROM p_today)::int,
                    mb.start_day
                  )
              AND de.date < p_today
          ), 0)::bigint AS spent_before,
          coalesce(sum(de.amount) FILTER (
            WHERE de.date > p_today
          ), 0)::bigint AS future_committed
        FROM daily_expenses de
        JOIN monthly_budgets mb
          ON mb.user_id  = de.user_id
         AND mb.month_id = p_month_id
        WHERE de.user_id  = ANY(p_user_ids)
          AND de.month_id = p_month_id
        GROUP BY de.user_id, mb.start_day
      ) agg
    ),

    -- 3. Non-card fixed expenses due today
    'fixed_expenses_today', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'user_id', user_id,
        'name',    name,
        'amount',  amount
      )), '[]'::jsonb)
      FROM fixed_expenses
      WHERE user_id  = ANY(p_user_ids)
        AND month_id = p_month_id
        AND due_day  = extract(day FROM p_today)::int
        AND is_paid      = false
        AND deleted_at   IS NULL
        AND credit_card_id IS NULL
    ),

    -- 4. Credit-card invoices due today (card name only, no amount pre-computed)
    'invoices_today', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'user_id',   cci.user_id,
        'card_name', cc.name
      )), '[]'::jsonb)
      FROM credit_card_invoices cci
      JOIN credit_cards cc ON cc.id = cci.credit_card_id
      WHERE cci.user_id      = ANY(p_user_ids)
        AND cci.due_month_id = p_month_id
        AND cci.is_paid      = false
        AND cc.due_day       = extract(day FROM p_today)::int
        AND cc.deleted_at    IS NULL
    )

  );
$$;
