-- Remove sensitive email columns from user_reviews table
ALTER TABLE public.user_reviews DROP COLUMN IF EXISTS customer_email;
ALTER TABLE public.user_reviews DROP COLUMN IF EXISTS garage_email;