-- Add DELETE policy for admins on garages table
CREATE POLICY "Admins can delete any garage"
ON public.garages
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Also add DELETE policy for garage_photos to clean up associated photos
CREATE POLICY "Admins can delete any garage photo"
ON public.garage_photos
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));