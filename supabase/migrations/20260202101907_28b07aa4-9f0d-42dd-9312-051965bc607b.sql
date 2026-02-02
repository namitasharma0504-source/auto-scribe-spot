-- Create enum for job card status
CREATE TYPE public.job_card_status AS ENUM ('pending', 'in_progress', 'waiting_parts', 'completed', 'delivered', 'cancelled');

-- Create enum for staff role
CREATE TYPE public.garage_staff_role AS ENUM ('owner', 'manager', 'mechanic', 'receptionist');

-- Garage Staff table for user access management
CREATE TABLE public.garage_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  garage_id UUID NOT NULL REFERENCES public.garages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  role garage_staff_role NOT NULL DEFAULT 'mechanic',
  is_active BOOLEAN DEFAULT true,
  pin_code TEXT, -- For quick login at garage terminal
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Spare Parts Inventory table
CREATE TABLE public.spare_parts_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  garage_id UUID NOT NULL REFERENCES public.garages(id) ON DELETE CASCADE,
  part_name TEXT NOT NULL,
  part_number TEXT,
  brand TEXT,
  category TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  min_stock_level INTEGER DEFAULT 5,
  purchase_price DECIMAL(10,2),
  selling_price DECIMAL(10,2) NOT NULL,
  warehouse_location TEXT,
  supplier_name TEXT,
  supplier_contact TEXT,
  last_restocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Job Cards table
CREATE TABLE public.job_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  garage_id UUID NOT NULL REFERENCES public.garages(id) ON DELETE CASCADE,
  job_card_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  customer_address TEXT,
  vehicle_make TEXT NOT NULL,
  vehicle_model TEXT NOT NULL,
  vehicle_year INTEGER,
  vehicle_number TEXT NOT NULL,
  vehicle_color TEXT,
  odometer_reading INTEGER,
  fuel_level TEXT,
  service_type TEXT NOT NULL,
  service_description TEXT,
  estimated_cost DECIMAL(10,2),
  final_cost DECIMAL(10,2),
  labor_cost DECIMAL(10,2) DEFAULT 0,
  parts_cost DECIMAL(10,2) DEFAULT 0,
  assigned_mechanic_id UUID REFERENCES public.garage_staff(id) ON DELETE SET NULL,
  status job_card_status NOT NULL DEFAULT 'pending',
  estimated_completion TIMESTAMPTZ,
  actual_completion TIMESTAMPTZ,
  customer_notes TEXT,
  internal_notes TEXT,
  before_photos TEXT[],
  after_photos TEXT[],
  customer_signature TEXT,
  is_paid BOOLEAN DEFAULT false,
  payment_method TEXT,
  created_by UUID REFERENCES public.garage_staff(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Job Card Parts (parts used in a job)
CREATE TABLE public.job_card_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_card_id UUID NOT NULL REFERENCES public.job_cards(id) ON DELETE CASCADE,
  part_id UUID NOT NULL REFERENCES public.spare_parts_inventory(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Customer History table
CREATE TABLE public.garage_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  garage_id UUID NOT NULL REFERENCES public.garages(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  customer_address TEXT,
  vehicle_make TEXT,
  vehicle_model TEXT,
  vehicle_number TEXT,
  total_visits INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  last_visit_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(garage_id, customer_phone)
);

-- Enable RLS on all tables
ALTER TABLE public.garage_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spare_parts_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_card_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.garage_customers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for garage_staff
CREATE POLICY "Garage owners can manage their staff"
ON public.garage_staff FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.garages g 
  WHERE g.id = garage_staff.garage_id AND g.owner_id = auth.uid()
));

CREATE POLICY "Staff can view their own record"
ON public.garage_staff FOR SELECT
USING (user_id = auth.uid());

-- RLS Policies for spare_parts_inventory
CREATE POLICY "Garage owners can manage inventory"
ON public.spare_parts_inventory FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.garages g 
  WHERE g.id = spare_parts_inventory.garage_id AND g.owner_id = auth.uid()
));

CREATE POLICY "Garage staff can view inventory"
ON public.spare_parts_inventory FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.garage_staff gs 
  WHERE gs.garage_id = spare_parts_inventory.garage_id 
  AND gs.user_id = auth.uid() 
  AND gs.is_active = true
));

CREATE POLICY "Garage staff can update inventory quantities"
ON public.spare_parts_inventory FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.garage_staff gs 
  WHERE gs.garage_id = spare_parts_inventory.garage_id 
  AND gs.user_id = auth.uid() 
  AND gs.is_active = true
));

-- RLS Policies for job_cards
CREATE POLICY "Garage owners can manage job cards"
ON public.job_cards FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.garages g 
  WHERE g.id = job_cards.garage_id AND g.owner_id = auth.uid()
));

CREATE POLICY "Garage staff can view job cards"
ON public.job_cards FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.garage_staff gs 
  WHERE gs.garage_id = job_cards.garage_id 
  AND gs.user_id = auth.uid() 
  AND gs.is_active = true
));

CREATE POLICY "Garage staff can create job cards"
ON public.job_cards FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.garage_staff gs 
  WHERE gs.garage_id = job_cards.garage_id 
  AND gs.user_id = auth.uid() 
  AND gs.is_active = true
));

CREATE POLICY "Garage staff can update job cards"
ON public.job_cards FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.garage_staff gs 
  WHERE gs.garage_id = job_cards.garage_id 
  AND gs.user_id = auth.uid() 
  AND gs.is_active = true
));

-- RLS Policies for job_card_parts
CREATE POLICY "Garage owners can manage job card parts"
ON public.job_card_parts FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.job_cards jc
  JOIN public.garages g ON g.id = jc.garage_id
  WHERE jc.id = job_card_parts.job_card_id AND g.owner_id = auth.uid()
));

CREATE POLICY "Garage staff can manage job card parts"
ON public.job_card_parts FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.job_cards jc
  JOIN public.garage_staff gs ON gs.garage_id = jc.garage_id
  WHERE jc.id = job_card_parts.job_card_id 
  AND gs.user_id = auth.uid() 
  AND gs.is_active = true
));

-- RLS Policies for garage_customers
CREATE POLICY "Garage owners can manage customers"
ON public.garage_customers FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.garages g 
  WHERE g.id = garage_customers.garage_id AND g.owner_id = auth.uid()
));

CREATE POLICY "Garage staff can view customers"
ON public.garage_customers FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.garage_staff gs 
  WHERE gs.garage_id = garage_customers.garage_id 
  AND gs.user_id = auth.uid() 
  AND gs.is_active = true
));

CREATE POLICY "Garage staff can insert customers"
ON public.garage_customers FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.garage_staff gs 
  WHERE gs.garage_id = garage_customers.garage_id 
  AND gs.user_id = auth.uid() 
  AND gs.is_active = true
));

CREATE POLICY "Garage staff can update customers"
ON public.garage_customers FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.garage_staff gs 
  WHERE gs.garage_id = garage_customers.garage_id 
  AND gs.user_id = auth.uid() 
  AND gs.is_active = true
));

-- Function to generate job card number
CREATE OR REPLACE FUNCTION public.generate_job_card_number(garage_uuid UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  year_part TEXT;
  sequence_num INTEGER;
  garage_prefix TEXT;
  new_number TEXT;
BEGIN
  year_part := EXTRACT(YEAR FROM NOW())::TEXT;
  
  -- Get first 3 chars of garage name for prefix
  SELECT UPPER(LEFT(REGEXP_REPLACE(name, '[^a-zA-Z]', '', 'g'), 3))
  INTO garage_prefix
  FROM public.garages WHERE id = garage_uuid;
  
  IF garage_prefix IS NULL OR garage_prefix = '' THEN
    garage_prefix := 'JOB';
  END IF;
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(job_card_number FROM LENGTH(garage_prefix) + 6) AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM public.job_cards
  WHERE garage_id = garage_uuid
  AND job_card_number LIKE garage_prefix || '-' || year_part || '-%';
  
  new_number := garage_prefix || '-' || year_part || '-' || LPAD(sequence_num::TEXT, 4, '0');
  RETURN new_number;
END;
$$;

-- Trigger to auto-generate job card number
CREATE OR REPLACE FUNCTION public.set_job_card_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.job_card_number IS NULL OR NEW.job_card_number = '' THEN
    NEW.job_card_number := public.generate_job_card_number(NEW.garage_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_job_card_number_trigger
BEFORE INSERT ON public.job_cards
FOR EACH ROW
EXECUTE FUNCTION public.set_job_card_number();

-- Trigger to auto-deduct inventory when parts are added to job card
CREATE OR REPLACE FUNCTION public.deduct_inventory_on_job_part()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.spare_parts_inventory
  SET quantity = quantity - NEW.quantity,
      updated_at = now()
  WHERE id = NEW.part_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER deduct_inventory_trigger
AFTER INSERT ON public.job_card_parts
FOR EACH ROW
EXECUTE FUNCTION public.deduct_inventory_on_job_part();

-- Trigger to restore inventory when parts are removed from job card
CREATE OR REPLACE FUNCTION public.restore_inventory_on_job_part_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.spare_parts_inventory
  SET quantity = quantity + OLD.quantity,
      updated_at = now()
  WHERE id = OLD.part_id;
  RETURN OLD;
END;
$$;

CREATE TRIGGER restore_inventory_trigger
AFTER DELETE ON public.job_card_parts
FOR EACH ROW
EXECUTE FUNCTION public.restore_inventory_on_job_part_delete();

-- Function to update customer history after job completion
CREATE OR REPLACE FUNCTION public.update_customer_on_job_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    INSERT INTO public.garage_customers (
      garage_id, customer_name, customer_phone, customer_email, 
      customer_address, vehicle_make, vehicle_model, vehicle_number,
      total_visits, total_spent, last_visit_at
    ) VALUES (
      NEW.garage_id, NEW.customer_name, NEW.customer_phone, NEW.customer_email,
      NEW.customer_address, NEW.vehicle_make, NEW.vehicle_model, NEW.vehicle_number,
      1, COALESCE(NEW.final_cost, 0), now()
    )
    ON CONFLICT (garage_id, customer_phone)
    DO UPDATE SET
      total_visits = garage_customers.total_visits + 1,
      total_spent = garage_customers.total_spent + COALESCE(NEW.final_cost, 0),
      last_visit_at = now(),
      vehicle_make = COALESCE(NEW.vehicle_make, garage_customers.vehicle_make),
      vehicle_model = COALESCE(NEW.vehicle_model, garage_customers.vehicle_model),
      vehicle_number = COALESCE(NEW.vehicle_number, garage_customers.vehicle_number),
      updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_customer_history_trigger
AFTER UPDATE ON public.job_cards
FOR EACH ROW
EXECUTE FUNCTION public.update_customer_on_job_complete();

-- Add updated_at triggers
CREATE TRIGGER update_garage_staff_updated_at
BEFORE UPDATE ON public.garage_staff
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_spare_parts_inventory_updated_at
BEFORE UPDATE ON public.spare_parts_inventory
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_cards_updated_at
BEFORE UPDATE ON public.job_cards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_garage_customers_updated_at
BEFORE UPDATE ON public.garage_customers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_spare_parts_garage ON public.spare_parts_inventory(garage_id);
CREATE INDEX idx_spare_parts_category ON public.spare_parts_inventory(category);
CREATE INDEX idx_spare_parts_low_stock ON public.spare_parts_inventory(garage_id, quantity) WHERE quantity <= min_stock_level;
CREATE INDEX idx_job_cards_garage ON public.job_cards(garage_id);
CREATE INDEX idx_job_cards_status ON public.job_cards(garage_id, status);
CREATE INDEX idx_job_cards_customer_phone ON public.job_cards(customer_phone);
CREATE INDEX idx_garage_staff_garage ON public.garage_staff(garage_id);
CREATE INDEX idx_garage_customers_garage ON public.garage_customers(garage_id);
CREATE INDEX idx_garage_customers_phone ON public.garage_customers(customer_phone);