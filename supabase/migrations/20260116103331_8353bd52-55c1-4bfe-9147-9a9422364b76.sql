-- Create function to generate GIN for partner listings
CREATE OR REPLACE FUNCTION generate_gin_for_partner()
RETURNS TRIGGER AS $$
DECLARE
  next_seq INTEGER;
BEGIN
  -- Only create partner listing if garage has a partner_id
  IF NEW.partner_id IS NOT NULL THEN
    -- Get the next sequence number for this partner
    SELECT COALESCE(COUNT(*), 0) + 1 INTO next_seq 
    FROM partner_listings 
    WHERE partner_id = NEW.partner_id;
    
    -- Insert into partner_listings (total_earning is a generated column, so don't insert it)
    INSERT INTO partner_listings (
      partner_id,
      listing_id,
      gin,
      status,
      base_earning,
      payout_status,
      submitted_at
    ) VALUES (
      NEW.partner_id,
      NEW.id,
      'GIN-' || EXTRACT(YEAR FROM NOW())::text || '-' || LPAD(next_seq::text, 6, '0'),
      'pending',
      20,
      'pending',
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on garages table
DROP TRIGGER IF EXISTS trigger_create_partner_listing ON garages;
CREATE TRIGGER trigger_create_partner_listing
  AFTER INSERT ON garages
  FOR EACH ROW
  EXECUTE FUNCTION generate_gin_for_partner();

-- Backfill existing garages that have partner_id but no partner_listings entry
INSERT INTO partner_listings (partner_id, listing_id, gin, status, base_earning, payout_status, submitted_at)
SELECT 
  g.partner_id,
  g.id,
  'GIN-' || EXTRACT(YEAR FROM g.created_at)::text || '-' || LPAD(ROW_NUMBER() OVER (PARTITION BY g.partner_id ORDER BY g.created_at)::text, 6, '0'),
  'pending',
  20,
  'pending',
  g.created_at
FROM garages g
WHERE g.partner_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM partner_listings pl WHERE pl.listing_id = g.id
);