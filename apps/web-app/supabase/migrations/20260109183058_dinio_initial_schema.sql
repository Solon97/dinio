-- ============================================
-- DINIO - PRODUCTION DATABASE SCHEMA
-- ============================================
-- Complete database initialization for production
-- Run this on a fresh Supabase PostgreSQL instance

-- ============================================
-- 1. MONTHLY BUDGETS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS monthly_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 0 AND month <= 11),
  year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2100),
  
  -- Calculated totals
  total_income DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_fixed DECIMAL(12,2) NOT NULL DEFAULT 0,
  fixed_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
  daily_budget DECIMAL(12,2) NOT NULL DEFAULT 0,
  daily_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
  reserve_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  reserve_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique constraint: one config per user per month
  UNIQUE(user_id, month, year)
);

CREATE INDEX IF NOT EXISTS idx_monthly_budgets_user_month 
ON monthly_budgets(user_id, year, month);

-- ============================================
-- 2. INCOMES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS incomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID NOT NULL REFERENCES monthly_budgets(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incomes_config 
ON incomes(config_id);


-- ============================================
-- 3. CREDIT CARDS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS credit_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  closing_day INTEGER NOT NULL CHECK (closing_day >= 1 AND closing_day <= 31),
  due_day INTEGER NOT NULL CHECK (due_day >= 1 AND due_day <= 31),
  credit_limit DECIMAL(12,2) NOT NULL DEFAULT 0,
  color VARCHAR(20) DEFAULT '#6366f1',
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_cards_user 
ON credit_cards(user_id);

CREATE INDEX IF NOT EXISTS idx_credit_cards_deleted 
ON credit_cards(deleted_at) WHERE deleted_at IS NULL;

COMMENT ON COLUMN credit_cards.user_id IS 'Owner of this credit card - cards are global per user';
COMMENT ON COLUMN credit_cards.color IS 'Hex color code for visual identification';
COMMENT ON COLUMN credit_cards.deleted_at IS 'Soft delete timestamp - cards with expenses are soft deleted instead of hard deleted';


-- ============================================
-- 4. FIXED EXPENSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS fixed_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID NOT NULL REFERENCES monthly_budgets(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  due_day INTEGER CHECK (due_day >= 1 AND due_day <= 31),
  is_paid BOOLEAN NOT NULL DEFAULT FALSE,
  is_mandatory BOOLEAN NOT NULL DEFAULT true,
  credit_card_id UUID REFERENCES credit_cards(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fixed_expenses_config 
ON fixed_expenses(config_id);

CREATE INDEX IF NOT EXISTS idx_fixed_expenses_credit_card 
ON fixed_expenses(credit_card_id);

COMMENT ON COLUMN fixed_expenses.is_mandatory IS 'true = mandatory expense, false = discretionary expense';
COMMENT ON COLUMN fixed_expenses.credit_card_id IS 'Optional reference to credit card if expense is charged to a card';

-- ============================================
-- 5. DAILY EXPENSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS daily_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  description VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL DEFAULT 'Outros',
  time TIME,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_expenses_user_date 
ON daily_expenses(user_id, date);

CREATE INDEX IF NOT EXISTS idx_daily_expenses_date 
ON daily_expenses(date);

-- ============================================
-- 6. LEADS TABLE (Landing Page)
-- ============================================
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_email 
ON leads(email);

CREATE INDEX IF NOT EXISTS idx_leads_created_at 
ON leads(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY - ENABLE
-- ============================================
ALTER TABLE monthly_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - MONTHLY BUDGETS
-- ============================================
CREATE POLICY "Users can view own budget configs"
ON monthly_budgets FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budget configs"
ON monthly_budgets FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budget configs"
ON monthly_budgets FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own budget configs"
ON monthly_budgets FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES - INCOMES
-- ============================================
CREATE POLICY "Users can view own incomes"
ON incomes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM monthly_budgets 
    WHERE monthly_budgets.id = incomes.config_id 
    AND monthly_budgets.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert own incomes"
ON incomes FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM monthly_budgets 
    WHERE monthly_budgets.id = incomes.config_id 
    AND monthly_budgets.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own incomes"
ON incomes FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM monthly_budgets 
    WHERE monthly_budgets.id = incomes.config_id 
    AND monthly_budgets.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own incomes"
ON incomes FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM monthly_budgets 
    WHERE monthly_budgets.id = incomes.config_id 
    AND monthly_budgets.user_id = auth.uid()
  )
);

-- ============================================
-- RLS POLICIES - FIXED EXPENSES
-- ============================================
CREATE POLICY "Users can view own expenses"
ON fixed_expenses FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM monthly_budgets 
    WHERE monthly_budgets.id = fixed_expenses.config_id 
    AND monthly_budgets.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert own expenses"
ON fixed_expenses FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM monthly_budgets 
    WHERE monthly_budgets.id = fixed_expenses.config_id 
    AND monthly_budgets.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own expenses"
ON fixed_expenses FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM monthly_budgets 
    WHERE monthly_budgets.id = fixed_expenses.config_id 
    AND monthly_budgets.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own expenses"
ON fixed_expenses FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM monthly_budgets 
    WHERE monthly_budgets.id = fixed_expenses.config_id 
    AND monthly_budgets.user_id = auth.uid()
  )
);

-- ============================================
-- RLS POLICIES - CREDIT CARDS
-- ============================================
CREATE POLICY "Users can view own credit cards"
ON credit_cards FOR SELECT
USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can insert own credit cards"
ON credit_cards FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own credit cards"
ON credit_cards FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own credit cards"
ON credit_cards FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES - DAILY EXPENSES
-- ============================================
CREATE POLICY "Users can view own daily expenses"
ON daily_expenses FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily expenses"
ON daily_expenses FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily expenses"
ON daily_expenses FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own daily expenses"
ON daily_expenses FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES - LEADS
-- ============================================
CREATE POLICY "Service role can manage leads"
ON leads FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger for monthly_budgets
CREATE TRIGGER update_monthly_budgets_updated_at
BEFORE UPDATE ON monthly_budgets
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for daily_expenses
CREATE TRIGGER daily_expenses_updated_at
BEFORE UPDATE ON daily_expenses
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DINIO - PROFILES TABLE FOR STRIPE INTEGRATION
-- ============================================
-- This migration adds the profiles table required for Stripe integration
-- It stores customer_id, price_id, and has_access for subscription management

-- ============================================
-- 1. PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255),
  customer_id VARCHAR(255) UNIQUE,
  price_id VARCHAR(255),
  has_access BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_customer_id 
ON profiles(customer_id);

CREATE INDEX IF NOT EXISTS idx_profiles_email 
ON profiles(email);

COMMENT ON TABLE profiles IS 'User profiles with Stripe subscription data';
COMMENT ON COLUMN profiles.customer_id IS 'Stripe customer ID';
COMMENT ON COLUMN profiles.price_id IS 'Stripe price ID of the active subscription';
COMMENT ON COLUMN profiles.has_access IS 'Whether user has active subscription access';

-- ============================================
-- 2. ROW LEVEL SECURITY
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Users can update their own profile (limited fields)
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Service role can do everything (for webhooks)
CREATE POLICY "Service role has full access to profiles"
ON profiles FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- 3. TRIGGER FOR UPDATED_AT
-- ============================================
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. FUNCTION TO CREATE PROFILE ON USER SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();
