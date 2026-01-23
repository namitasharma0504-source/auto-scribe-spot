
-- Drop existing admin policy on partners
DROP POLICY IF EXISTS "Admins can manage all partners" ON public.partners;

-- Create new admin policy using has_role function to avoid recursion
CREATE POLICY "Admins can manage all partners"
ON public.partners
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));
