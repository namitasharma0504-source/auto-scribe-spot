-- Add column to control access to Garage Management SaaS features
ALTER TABLE public.garages 
ADD COLUMN gms_enabled boolean DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN public.garages.gms_enabled IS 'Admin-controlled flag to enable Job Cards, Inventory, and Staff Management features for this garage';