-- Add unique constraint on name + phone to prevent duplicate garages
-- Using a unique index to handle NULL phone values properly
CREATE UNIQUE INDEX IF NOT EXISTS idx_garages_unique_name_phone 
ON public.garages (LOWER(TRIM(name)), COALESCE(phone, ''));