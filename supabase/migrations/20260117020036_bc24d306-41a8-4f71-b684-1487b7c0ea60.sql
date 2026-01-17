-- Add state column to profiles table for user location
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS state text;

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.state IS 'Geographic state/region of the user';