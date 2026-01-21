-- Create a trigger function to prevent garage owners from modifying subscription fields
CREATE OR REPLACE FUNCTION public.protect_subscription_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- If the user is not an admin, prevent changes to subscription-related fields
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    -- Preserve original subscription fields - garage owners cannot modify these
    NEW.subscription_active := OLD.subscription_active;
    NEW.subscription_date := OLD.subscription_date;
    NEW.subscription_end_date := OLD.subscription_end_date;
    NEW.listing_date := OLD.listing_date;
    NEW.signup_date := OLD.signup_date;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger that fires before UPDATE on garage_owners
DROP TRIGGER IF EXISTS protect_garage_owner_subscription_fields ON public.garage_owners;
CREATE TRIGGER protect_garage_owner_subscription_fields
  BEFORE UPDATE ON public.garage_owners
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_subscription_fields();