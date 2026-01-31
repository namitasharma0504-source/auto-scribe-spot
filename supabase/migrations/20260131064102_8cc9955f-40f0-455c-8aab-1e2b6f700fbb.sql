-- Add vehicle_types column to garages table (array to support both 2W and 4W)
-- Default to '4-wheeler' for backward compatibility with existing data
ALTER TABLE public.garages 
ADD COLUMN vehicle_types text[] DEFAULT ARRAY['4-wheeler']::text[];

-- Update all existing garages to have '4-wheeler' if vehicle_types is null
UPDATE public.garages 
SET vehicle_types = ARRAY['4-wheeler']::text[] 
WHERE vehicle_types IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.garages.vehicle_types IS 'Array of vehicle types this garage services: 4-wheeler, 2-wheeler, or both';