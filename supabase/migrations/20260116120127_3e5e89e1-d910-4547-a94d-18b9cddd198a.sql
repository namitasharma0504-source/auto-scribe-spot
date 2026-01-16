-- Add columns to garages table for location verification
ALTER TABLE public.garages 
ADD COLUMN IF NOT EXISTS captured_latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS captured_longitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS location_captured_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS location_capture_method TEXT CHECK (location_capture_method IN ('gps', 'maps_link', 'manual'));

-- Add comment explaining these columns
COMMENT ON COLUMN public.garages.captured_latitude IS 'GPS latitude captured when partner listed the garage';
COMMENT ON COLUMN public.garages.captured_longitude IS 'GPS longitude captured when partner listed the garage';
COMMENT ON COLUMN public.garages.location_captured_at IS 'Timestamp when location was captured';
COMMENT ON COLUMN public.garages.location_capture_method IS 'How location was captured: gps (live), maps_link, or manual';