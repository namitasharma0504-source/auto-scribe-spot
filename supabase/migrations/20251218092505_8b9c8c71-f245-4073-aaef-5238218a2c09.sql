-- Add admin policies to redemptions table for customer support and fraud prevention

-- Allow admins to view all redemptions
CREATE POLICY "Admins can view all redemptions"
ON public.redemptions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update redemptions
CREATE POLICY "Admins can update redemptions"
ON public.redemptions
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete redemptions
CREATE POLICY "Admins can delete redemptions"
ON public.redemptions
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));