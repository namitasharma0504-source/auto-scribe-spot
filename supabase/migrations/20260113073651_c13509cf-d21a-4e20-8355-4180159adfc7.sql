-- Add columns to existing garages table
ALTER TABLE public.garages 
ADD COLUMN IF NOT EXISTS partner_id TEXT,
ADD COLUMN IF NOT EXISTS referral_source TEXT DEFAULT 'direct';

-- Create partners table with custom ID format
CREATE TABLE public.partners (
  id TEXT PRIMARY KEY, -- format: MG2026P0123
  user_id UUID REFERENCES auth.users(id), -- link to auth user
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  email TEXT,
  profile_photo TEXT,
  pan_number TEXT UNIQUE,
  pan_document TEXT,
  aadhaar_number TEXT,
  aadhaar_document TEXT,
  kyc_status TEXT DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'submitted', 'verified', 'rejected')),
  bank_name TEXT,
  account_number TEXT,
  ifsc_code TEXT,
  account_holder_name TEXT,
  bank_verified BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Create partner_listings table
CREATE TABLE public.partner_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id TEXT NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES public.garages(id) ON DELETE SET NULL,
  gin TEXT UNIQUE, -- format: GIN-2026-000123
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'under_review')),
  rejection_reason TEXT,
  base_earning DECIMAL(10,2) DEFAULT 20.00,
  reputation_upsell BOOLEAN DEFAULT false,
  reputation_earning DECIMAL(10,2) DEFAULT 0,
  reputation_payment_id TEXT,
  gms_upsell BOOLEAN DEFAULT false,
  gms_earning DECIMAL(10,2) DEFAULT 0,
  gms_payment_id TEXT,
  total_earning DECIMAL(10,2) GENERATED ALWAYS AS (base_earning + reputation_earning + gms_earning) STORED,
  payout_status TEXT DEFAULT 'pending' CHECK (payout_status IN ('pending', 'processing', 'paid', 'failed')),
  payout_date DATE,
  payout_transaction_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create payouts table
CREATE TABLE public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id TEXT NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  payout_date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  data_collection_count INTEGER DEFAULT 0,
  data_collection_earnings DECIMAL(10,2) DEFAULT 0,
  reputation_sales_count INTEGER DEFAULT 0,
  reputation_earnings DECIMAL(10,2) DEFAULT 0,
  gms_sales_count INTEGER DEFAULT 0,
  gms_earnings DECIMAL(10,2) DEFAULT 0,
  transaction_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create disputes table
CREATE TABLE public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id TEXT NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES public.partner_listings(id) ON DELETE SET NULL,
  gin TEXT,
  reason TEXT NOT NULL,
  supporting_evidence TEXT[],
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'resolved', 'rejected')),
  admin_response TEXT,
  resolution_date TIMESTAMP WITH TIME ZONE,
  outcome TEXT CHECK (outcome IN ('approved', 'rejected', 'partial') OR outcome IS NULL),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create partner_feedback table
CREATE TABLE public.partner_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id TEXT NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
  ease_of_use_rating INTEGER CHECK (ease_of_use_rating BETWEEN 1 AND 5),
  payment_transparency_rating INTEGER CHECK (payment_transparency_rating BETWEEN 1 AND 5),
  support_quality_rating INTEGER CHECK (support_quality_rating BETWEEN 1 AND 5),
  earning_potential_rating INTEGER CHECK (earning_potential_rating BETWEEN 1 AND 5),
  written_feedback TEXT,
  suggestions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_partners_user_id ON public.partners(user_id);
CREATE INDEX idx_partners_status ON public.partners(status);
CREATE INDEX idx_partner_listings_partner_id ON public.partner_listings(partner_id);
CREATE INDEX idx_partner_listings_status ON public.partner_listings(status);
CREATE INDEX idx_partner_listings_gin ON public.partner_listings(gin);
CREATE INDEX idx_payouts_partner_id ON public.payouts(partner_id);
CREATE INDEX idx_payouts_status ON public.payouts(status);
CREATE INDEX idx_disputes_partner_id ON public.disputes(partner_id);
CREATE INDEX idx_disputes_status ON public.disputes(status);
CREATE INDEX idx_garages_partner_id ON public.garages(partner_id);

-- Enable RLS on all new tables
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for partners table
CREATE POLICY "Partners can view own profile" ON public.partners
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Partners can update own profile" ON public.partners
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all partners" ON public.partners
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for partner_listings table
CREATE POLICY "Partners can view own listings" ON public.partner_listings
  FOR SELECT USING (
    partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid())
  );

CREATE POLICY "Partners can insert own listings" ON public.partner_listings
  FOR INSERT WITH CHECK (
    partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid())
  );

CREATE POLICY "Partners can update own listings" ON public.partner_listings
  FOR UPDATE USING (
    partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can manage all partner_listings" ON public.partner_listings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for payouts table
CREATE POLICY "Partners can view own payouts" ON public.payouts
  FOR SELECT USING (
    partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can manage all payouts" ON public.payouts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for disputes table
CREATE POLICY "Partners can view own disputes" ON public.disputes
  FOR SELECT USING (
    partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid())
  );

CREATE POLICY "Partners can create disputes" ON public.disputes
  FOR INSERT WITH CHECK (
    partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid())
  );

CREATE POLICY "Partners can update own disputes" ON public.disputes
  FOR UPDATE USING (
    partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can manage all disputes" ON public.disputes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for partner_feedback table
CREATE POLICY "Partners can view own feedback" ON public.partner_feedback
  FOR SELECT USING (
    partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid())
  );

CREATE POLICY "Partners can submit feedback" ON public.partner_feedback
  FOR INSERT WITH CHECK (
    partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can view all feedback" ON public.partner_feedback
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Function to generate partner ID
CREATE OR REPLACE FUNCTION public.generate_partner_id()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  year_part TEXT;
  sequence_num INTEGER;
  new_id TEXT;
BEGIN
  year_part := EXTRACT(YEAR FROM NOW())::TEXT;
  SELECT COALESCE(MAX(CAST(SUBSTRING(id FROM 9) AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM public.partners
  WHERE id LIKE 'MG' || year_part || 'P%';
  
  new_id := 'MG' || year_part || 'P' || LPAD(sequence_num::TEXT, 4, '0');
  RETURN new_id;
END;
$$;

-- Function to generate GIN
CREATE OR REPLACE FUNCTION public.generate_gin()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  year_part TEXT;
  sequence_num INTEGER;
  new_gin TEXT;
BEGIN
  year_part := EXTRACT(YEAR FROM NOW())::TEXT;
  SELECT COALESCE(MAX(CAST(SUBSTRING(gin FROM 10) AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM public.partner_listings
  WHERE gin LIKE 'GIN-' || year_part || '-%';
  
  new_gin := 'GIN-' || year_part || '-' || LPAD(sequence_num::TEXT, 6, '0');
  RETURN new_gin;
END;
$$;

-- Trigger to auto-generate GIN on insert
CREATE OR REPLACE FUNCTION public.set_partner_listing_gin()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.gin IS NULL OR NEW.gin = '' THEN
    NEW.gin := public.generate_gin();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_partner_listing_gin
  BEFORE INSERT ON public.partner_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_partner_listing_gin();