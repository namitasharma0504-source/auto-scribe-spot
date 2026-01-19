-- Add attendance and approved_partner columns to partner_applications table
ALTER TABLE public.partner_applications
ADD COLUMN attendance BOOLEAN DEFAULT false,
ADD COLUMN approved_partner BOOLEAN DEFAULT false;