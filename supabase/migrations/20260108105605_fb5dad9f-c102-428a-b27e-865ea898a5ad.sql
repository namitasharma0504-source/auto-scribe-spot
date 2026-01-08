-- Allow admins to update any garage
CREATE POLICY "Admins can update any garage" 
ON public.garages 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));