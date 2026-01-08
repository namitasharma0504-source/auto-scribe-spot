-- Add customer_display_name column to user_reviews for admin overrides
ALTER TABLE public.user_reviews 
ADD COLUMN customer_display_name text;

-- Add a comment explaining its purpose
COMMENT ON COLUMN public.user_reviews.customer_display_name IS 'Admin-editable display name that overrides the profile name for this specific review';