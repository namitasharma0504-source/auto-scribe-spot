-- Drop the public SELECT policy that exposes user_id
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.user_reviews;

-- Re-add policy for users to view their own reviews (with user_id)
CREATE POLICY "Users can view own reviews"
ON public.user_reviews
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create a public view that excludes user_id for anonymous/public access
CREATE OR REPLACE VIEW public.public_reviews AS
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