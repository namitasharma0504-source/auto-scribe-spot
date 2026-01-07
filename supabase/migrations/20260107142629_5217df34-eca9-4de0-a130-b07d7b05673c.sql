-- Drop the existing permissive INSERT policy
DROP POLICY IF EXISTS "Anyone can submit leads" ON public.garage_leads;

-- Create new INSERT policy requiring authentication
CREATE POLICY "Authenticated users can submit leads"
ON public.garage_leads
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);