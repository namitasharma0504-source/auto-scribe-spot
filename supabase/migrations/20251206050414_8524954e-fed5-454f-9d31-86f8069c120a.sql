-- Add admin SELECT policy for garage_owners table
CREATE POLICY "Admins can view all garage owners"
ON public.garage_owners
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));