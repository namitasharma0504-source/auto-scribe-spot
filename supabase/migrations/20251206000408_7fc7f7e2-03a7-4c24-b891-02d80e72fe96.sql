-- Add status column to user_reviews for moderation workflow
ALTER TABLE public.user_reviews 
ADD COLUMN status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));

-- Add garage_email column to store garage contact email for notifications
ALTER TABLE public.user_reviews 
ADD COLUMN garage_email text;

-- Add customer_email column to store customer email for notifications
ALTER TABLE public.user_reviews 
ADD COLUMN customer_email text;

-- Update the get_public_reviews function to only return approved reviews
CREATE OR REPLACE FUNCTION public.get_public_reviews()
RETURNS TABLE(
  id uuid, 
  garage_name text, 
  garage_location text, 
  rating integer, 
  review_text text, 
  is_verified boolean, 
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    id,
    garage_name,
    garage_location,
    rating,
    review_text,
    is_verified,
    created_at
  FROM public.user_reviews
  WHERE status = 'approved';
$$;