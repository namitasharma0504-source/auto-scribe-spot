-- Drop existing foreign key constraints and recreate with ON DELETE CASCADE

-- 1. garage_photos -> garages
ALTER TABLE public.garage_photos
DROP CONSTRAINT IF EXISTS garage_photos_garage_id_fkey;

ALTER TABLE public.garage_photos
ADD CONSTRAINT garage_photos_garage_id_fkey
FOREIGN KEY (garage_id) REFERENCES public.garages(id) ON DELETE CASCADE;

-- 2. garage_leads -> garages
ALTER TABLE public.garage_leads
DROP CONSTRAINT IF EXISTS garage_leads_garage_id_fkey;

ALTER TABLE public.garage_leads
ADD CONSTRAINT garage_leads_garage_id_fkey
FOREIGN KEY (garage_id) REFERENCES public.garages(id) ON DELETE CASCADE;

-- 3. garage_claim_requests -> garages
ALTER TABLE public.garage_claim_requests
DROP CONSTRAINT IF EXISTS garage_claim_requests_garage_id_fkey;

ALTER TABLE public.garage_claim_requests
ADD CONSTRAINT garage_claim_requests_garage_id_fkey
FOREIGN KEY (garage_id) REFERENCES public.garages(id) ON DELETE CASCADE;

-- 4. garage_offers -> garages
ALTER TABLE public.garage_offers
DROP CONSTRAINT IF EXISTS garage_offers_garage_id_fkey;

ALTER TABLE public.garage_offers
ADD CONSTRAINT garage_offers_garage_id_fkey
FOREIGN KEY (garage_id) REFERENCES public.garages(id) ON DELETE CASCADE;

-- 5. garage_meta_credentials -> garages
ALTER TABLE public.garage_meta_credentials
DROP CONSTRAINT IF EXISTS garage_meta_credentials_garage_id_fkey;

ALTER TABLE public.garage_meta_credentials
ADD CONSTRAINT garage_meta_credentials_garage_id_fkey
FOREIGN KEY (garage_id) REFERENCES public.garages(id) ON DELETE CASCADE;

-- 6. verification_requests -> garages
ALTER TABLE public.verification_requests
DROP CONSTRAINT IF EXISTS verification_requests_garage_id_fkey;

ALTER TABLE public.verification_requests
ADD CONSTRAINT verification_requests_garage_id_fkey
FOREIGN KEY (garage_id) REFERENCES public.garages(id) ON DELETE CASCADE;

-- 7. Also handle garage_owners - set garage_id to NULL when garage is deleted
ALTER TABLE public.garage_owners
DROP CONSTRAINT IF EXISTS garage_owners_garage_id_fkey;

ALTER TABLE public.garage_owners
ADD CONSTRAINT garage_owners_garage_id_fkey
FOREIGN KEY (garage_id) REFERENCES public.garages(id) ON DELETE SET NULL;