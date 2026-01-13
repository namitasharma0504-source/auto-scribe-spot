-- Add listing_type column to garages table to track who uploaded the garage
ALTER TABLE public.garages 
ADD COLUMN IF NOT EXISTS listing_type TEXT DEFAULT 'admin' CHECK (listing_type IN ('owner', 'customer', 'partner', 'admin'));