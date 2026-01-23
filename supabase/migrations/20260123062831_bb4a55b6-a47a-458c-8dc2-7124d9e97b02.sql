-- Fix the generate_gin_for_partner function to NOT set gin manually
-- Let the BEFORE INSERT trigger (set_partner_listing_gin) handle it using generate_gin()
CREATE OR REPLACE FUNCTION generate_gin_for_partner()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create partner listing if garage has a partner_id
  IF NEW.partner_id IS NOT NULL THEN
    -- Insert into partner_listings WITHOUT setting gin (let the before trigger handle it)
    INSERT INTO partner_listings (
      partner_id,
      listing_id,
      status,
      base_earning,
      payout_status,
      submitted_at
    ) VALUES (
      NEW.partner_id,
      NEW.id,
      'pending',
      20,
      'pending',
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;