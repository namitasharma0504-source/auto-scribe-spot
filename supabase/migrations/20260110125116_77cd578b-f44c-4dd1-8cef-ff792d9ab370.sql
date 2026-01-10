-- Add webinar booking columns to partner_applications table
ALTER TABLE public.partner_applications 
ADD COLUMN webinar_slot text DEFAULT NULL,
ADD COLUMN webinar_booked_at timestamp with time zone DEFAULT NULL;