-- Add unique constraint on phone to prevent duplicates at database level
CREATE UNIQUE INDEX partner_applications_phone_unique ON public.partner_applications (phone);