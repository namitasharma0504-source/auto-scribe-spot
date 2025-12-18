-- Create garage_offers table for storing offers/discounts
CREATE TABLE public.garage_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  garage_id UUID NOT NULL REFERENCES public.garages(id) ON DELETE CASCADE,
  template_type TEXT NOT NULL, -- e.g., 'percentage_off', 'flat_discount', 'free_service', 'bundle_deal'
  title TEXT NOT NULL,
  description TEXT,
  discount_value TEXT, -- e.g., '20%', '₹500', 'Free'
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  is_promoted_to_meta BOOLEAN DEFAULT false,
  meta_ad_id TEXT, -- Store Meta ad ID if pushed
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create garage_meta_credentials table for storing Meta API credentials
CREATE TABLE public.garage_meta_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  garage_id UUID NOT NULL REFERENCES public.garages(id) ON DELETE CASCADE UNIQUE,
  meta_app_id TEXT,
  meta_app_secret TEXT,
  meta_access_token TEXT,
  meta_ad_account_id TEXT,
  meta_page_id TEXT,
  is_verified BOOLEAN DEFAULT false,
  last_verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.garage_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.garage_meta_credentials ENABLE ROW LEVEL SECURITY;

-- RLS policies for garage_offers
CREATE POLICY "Anyone can view active offers"
ON public.garage_offers
FOR SELECT
USING (is_active = true);

CREATE POLICY "Garage owners can manage their offers"
ON public.garage_offers
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.garages g
    WHERE g.id = garage_id AND g.owner_id = auth.uid()
  )
);

-- RLS policies for garage_meta_credentials
CREATE POLICY "Garage owners can view their meta credentials"
ON public.garage_meta_credentials
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.garages g
    WHERE g.id = garage_id AND g.owner_id = auth.uid()
  )
);

CREATE POLICY "Garage owners can insert their meta credentials"
ON public.garage_meta_credentials
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.garages g
    WHERE g.id = garage_id AND g.owner_id = auth.uid()
  )
);

CREATE POLICY "Garage owners can update their meta credentials"
ON public.garage_meta_credentials
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.garages g
    WHERE g.id = garage_id AND g.owner_id = auth.uid()
  )
);

CREATE POLICY "Garage owners can delete their meta credentials"
ON public.garage_meta_credentials
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.garages g
    WHERE g.id = garage_id AND g.owner_id = auth.uid()
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_garage_offers_updated_at
BEFORE UPDATE ON public.garage_offers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_garage_meta_credentials_updated_at
BEFORE UPDATE ON public.garage_meta_credentials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();