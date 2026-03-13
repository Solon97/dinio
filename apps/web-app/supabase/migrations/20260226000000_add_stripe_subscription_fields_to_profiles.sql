ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(32) NOT NULL DEFAULT 'inactive';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_subscription_status_check'
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT profiles_subscription_status_check
      CHECK (
        subscription_status IN (
          'inactive',
          'trialing',
          'active',
          'past_due',
          'canceled',
          'unpaid',
          'incomplete',
          'incomplete_expired'
        )
      );
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_stripe_subscription_id
ON profiles(stripe_subscription_id)
WHERE stripe_subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status
ON profiles(subscription_status);
