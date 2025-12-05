-- Drop and recreate the view with SECURITY INVOKER
DROP VIEW IF EXISTS public.public_reviews;

CREATE VIEW public.public_reviews 
WITH (security_invoker = true) AS
SELECT 
  id,
  garage_name,
  garage_location,
  rating,
  review_text,
  is_verified,
  created_at
FROM public.user_reviews;

-- Grant public read access to the view
GRANT SELECT ON public.public_reviews TO anon, authenticated;

-- Add a permissive SELECT policy for public/anon access to the underlying table
-- This allows the security invoker view to read data
CREATE POLICY "Public can read reviews via view"
ON public.user_reviews
FOR SELECT
TO anon
USING (true);