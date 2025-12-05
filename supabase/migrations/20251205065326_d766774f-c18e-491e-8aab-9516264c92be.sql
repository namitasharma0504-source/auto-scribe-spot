-- Drop the existing restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view own reviews" ON public.user_reviews;

-- Create a PERMISSIVE public SELECT policy so anyone can read reviews
CREATE POLICY "Anyone can view reviews"
ON public.user_reviews
FOR SELECT
TO public
USING (true);