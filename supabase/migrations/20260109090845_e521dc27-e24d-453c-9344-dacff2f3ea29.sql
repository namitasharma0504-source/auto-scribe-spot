-- Create table for partner applications
CREATE TABLE public.partner_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  state TEXT NOT NULL,
  city TEXT,
  education TEXT NOT NULL,
  why_join TEXT NOT NULL,
  garage_network TEXT,
  estimated_garages TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.partner_applications ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to view all applications
CREATE POLICY "Admins can view all partner applications"
ON public.partner_applications
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create policy for admins to update applications
CREATE POLICY "Admins can update partner applications"
ON public.partner_applications
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create policy for admins to delete applications
CREATE POLICY "Admins can delete partner applications"
ON public.partner_applications
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create policy for anyone to submit an application (public form)
CREATE POLICY "Anyone can submit partner applications"
ON public.partner_applications
FOR INSERT
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_partner_applications_updated_at
BEFORE UPDATE ON public.partner_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();