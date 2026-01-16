-- Add payment proof column to partner_listings table
ALTER TABLE public.partner_listings 
ADD COLUMN IF NOT EXISTS payment_proof_url TEXT DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.partner_listings.payment_proof_url IS 'File path in partner-documents bucket for upsell payment proof screenshot';