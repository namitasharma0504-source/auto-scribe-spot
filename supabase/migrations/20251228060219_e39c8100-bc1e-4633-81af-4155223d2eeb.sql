-- Add dispute_reason column to user_reviews table for storing garage owner dispute reasons
ALTER TABLE public.user_reviews 
ADD COLUMN IF NOT EXISTS dispute_reason text,
ADD COLUMN IF NOT EXISTS disputed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS garage_id uuid;

-- Add RLS policy for garage owners to view reviews for their garage
CREATE POLICY "Garage owners can view reviews for their garage"
ON public.user_reviews
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM garages g 
    WHERE g.name = user_reviews.garage_name 
    AND g.owner_id = auth.uid()
  )
);

-- Add RLS policy for garage owners to update (dispute) reviews for their garage
CREATE POLICY "Garage owners can dispute reviews for their garage"
ON public.user_reviews
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM garages g 
    WHERE g.name = user_reviews.garage_name 
    AND g.owner_id = auth.uid()
  )
  AND status = 'approved'
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM garages g 
    WHERE g.name = user_reviews.garage_name 
    AND g.owner_id = auth.uid()
  )
);