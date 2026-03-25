-- ============================================
-- ADD name COLUMN TO profiles TABLE
-- ============================================
-- Adds the user's display name to the profiles table.
-- For existing records, populates from auth.users.raw_user_meta_data->>'name'
-- (populated automatically by Supabase for OAuth/Google signups).
-- Users without metadata name (e.g. email/password) will have name = ''.

-- Step 1: Add column with a default to satisfy NOT NULL for existing rows
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS name VARCHAR(255) NOT NULL DEFAULT '';

-- Step 2: Populate existing profiles from auth.users metadata
UPDATE public.profiles p
SET name = COALESCE(u.raw_user_meta_data->>'name', '')
FROM auth.users u
WHERE u.id = p.id;

-- Step 3: Update handle_new_user to capture name on every new signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON COLUMN public.profiles.name IS 'Display name from OAuth provider metadata (raw_user_meta_data.name)';
