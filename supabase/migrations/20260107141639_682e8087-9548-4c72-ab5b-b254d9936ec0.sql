-- Create garage leads table to store quote requests
CREATE TABLE public.garage_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  garage_id UUID NOT NULL REFERENCES public.garages(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  vehicle_details TEXT,
  service_required TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  admin_notes TEXT,
  contacted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.garage_leads ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a lead (public form)
CREATE POLICY "Anyone can submit leads"
ON public.garage_leads
FOR INSERT
WITH CHECK (true);

-- Admins can view all leads
CREATE POLICY "Admins can view all leads"
ON public.garage_leads
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Admins can update all leads
CREATE POLICY "Admins can update leads"
ON public.garage_leads
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Admins can delete leads
CREATE POLICY "Admins can delete leads"
ON public.garage_leads
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Garage owners can view leads for their garage
CREATE POLICY "Garage owners can view their leads"
ON public.garage_leads
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.garages g
    WHERE g.id = garage_leads.garage_id AND g.owner_id = auth.uid()
  )
);

-- Garage owners can update leads for their garage
CREATE POLICY "Garage owners can update their leads"
ON public.garage_leads
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.garages g
    WHERE g.id = garage_leads.garage_id AND g.owner_id = auth.uid()
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_garage_leads_updated_at
BEFORE UPDATE ON public.garage_leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes
CREATE INDEX idx_garage_leads_garage_id ON public.garage_leads(garage_id);
CREATE INDEX idx_garage_leads_status ON public.garage_leads(status);
CREATE INDEX idx_garage_leads_created_at ON public.garage_leads(created_at DESC);