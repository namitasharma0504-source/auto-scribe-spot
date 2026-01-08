-- Add is_approved column to garages table for validation-based approval
ALTER TABLE public.garages 
ADD COLUMN IF NOT EXISTS is_approved boolean DEFAULT true;

-- Add submitted_by column to track who submitted the garage
ALTER TABLE public.garages 
ADD COLUMN IF NOT EXISTS submitted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add approval_notes for admin feedback
ALTER TABLE public.garages 
ADD COLUMN IF NOT EXISTS approval_notes text;

-- Set all existing garages as approved (they were already live)
UPDATE public.garages SET is_approved = true WHERE is_approved IS NULL;