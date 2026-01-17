-- Add is_active column to profiles table for enable/disable access
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.is_active IS 'Whether the user account is active and can access the platform';

-- Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);