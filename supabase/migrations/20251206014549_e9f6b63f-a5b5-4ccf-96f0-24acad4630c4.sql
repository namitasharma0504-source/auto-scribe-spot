-- Add badge columns to garages table for garage owner customization
ALTER TABLE public.garages 
ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_certified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_recommended boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS has_discounts boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS response_time text,
ADD COLUMN IF NOT EXISTS walk_in_welcome boolean DEFAULT true;