-- Add occupation column and remove unused columns from partner_applications
ALTER TABLE public.partner_applications 
ADD COLUMN occupation TEXT;

-- Remove columns that are no longer needed
ALTER TABLE public.partner_applications 
DROP COLUMN IF EXISTS garage_network,
DROP COLUMN IF EXISTS estimated_garages;