-- Add unique constraint on user_id for upsert to work
ALTER TABLE garage_owners 
ADD CONSTRAINT garage_owners_user_id_unique UNIQUE (user_id);

-- Add RLS policy allowing admins to update any garage_owner record
CREATE POLICY "Admins can update all garage owners"
ON garage_owners FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));