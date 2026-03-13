-- ============================================
-- LEADS TABLE - USER VIEW POLICY
-- ============================================
-- Allows authenticated users to view their own lead record by email

-- Create the corrected policy using JWT token
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Garanta um índice
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads (email);

-- Policy: apenas usuários autenticados podem ler o próprio lead por email (insensível a case)
CREATE POLICY "Users can view own lead by email"
ON public.leads
FOR SELECT
TO authenticated
USING (
  lower(email) = lower((auth.jwt() ->> 'email'))
);

COMMENT ON POLICY "Users can view own lead by email" ON leads IS 
'Allows authenticated users to view lead records that match their email address from JWT token';
