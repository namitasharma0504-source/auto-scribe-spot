-- Drop the problematic view and policy
DROP VIEW IF EXISTS public.public_reviews;
DROP POLICY IF EXISTS "Public can read reviews via view" ON public.user_reviews;

-- Create a security definer function that returns reviews without user_id
CREATE OR REPLACE FUNCTION public.get_public_reviews()
RETURNS TABLE (
  id uuid,
  garage_name text,
  garage_location text,
  rating integer,
  review_text text,
  is_verified boolean,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    garage_name,
    garage_location,
    rating,
    review_text,
    is_verified,
    created_at
  FROM public.user_reviews;
$$;

-- Grant execute to everyone
GRANT EXECUTE ON FUNCTION public.get_public_reviews() TO anon, authenticated;