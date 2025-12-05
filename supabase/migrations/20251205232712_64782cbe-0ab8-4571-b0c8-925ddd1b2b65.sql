-- Create garages table
CREATE TABLE public.garages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  state TEXT,
  city TEXT,
  country TEXT DEFAULT 'India',
  location_link TEXT,
  photo_url TEXT,
  services TEXT[],
  pricing TEXT,
  special_offers TEXT,
  rating NUMERIC(2,1) DEFAULT 5.0,
  review_count INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create garage_owners table for garage-specific user data
CREATE TABLE public.garage_owners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  garage_id UUID REFERENCES public.garages(id) ON DELETE SET NULL,
  business_name TEXT,
  contact_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table for role management
CREATE TYPE public.app_role AS ENUM ('admin', 'customer', 'garage_owner');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.garages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.garage_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS Policies for garages
CREATE POLICY "Anyone can view garages"
ON public.garages FOR SELECT
USING (true);

CREATE POLICY "Garage owners can insert their garage"
ON public.garages FOR INSERT
WITH CHECK (auth.uid() = owner_id OR owner_id IS NULL);

CREATE POLICY "Garage owners can update their garage"
ON public.garages FOR UPDATE
USING (auth.uid() = owner_id);

-- RLS Policies for garage_owners
CREATE POLICY "Garage owners can view their own profile"
ON public.garage_owners FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Garage owners can insert their profile"
ON public.garage_owners FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Garage owners can update their profile"
ON public.garage_owners FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert roles"
ON public.user_roles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create indexes for search
CREATE INDEX idx_garages_city ON public.garages(city);
CREATE INDEX idx_garages_country ON public.garages(country);
CREATE INDEX idx_garages_name ON public.garages USING gin(to_tsvector('english', name));

-- Trigger for updated_at
CREATE TRIGGER update_garages_updated_at
BEFORE UPDATE ON public.garages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_garage_owners_updated_at
BEFORE UPDATE ON public.garage_owners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();