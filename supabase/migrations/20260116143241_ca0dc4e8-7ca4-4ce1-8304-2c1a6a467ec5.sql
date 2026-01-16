-- Add verification tracking columns to partner_listings
ALTER TABLE partner_listings
ADD COLUMN IF NOT EXISTS reputation_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS gms_verified boolean DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN partner_listings.reputation_verified IS 'Admin verified reputation management payment proof';
COMMENT ON COLUMN partner_listings.gms_verified IS 'Admin verified GMS software payment proof';