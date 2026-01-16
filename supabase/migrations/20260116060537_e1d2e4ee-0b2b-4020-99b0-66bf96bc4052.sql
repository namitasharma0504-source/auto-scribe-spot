-- Add three date fields to garage_owners table for admin management
ALTER TABLE public.garage_owners
ADD COLUMN IF NOT EXISTS signup_date date,
ADD COLUMN IF NOT EXISTS listing_date date,
ADD COLUMN IF NOT EXISTS subscription_date date;

-- Add a comment to describe the columns
COMMENT ON COLUMN public.garage_owners.signup_date IS 'The date when the garage owner account was created (editable by admin)';
COMMENT ON COLUMN public.garage_owners.listing_date IS 'The date when the garage listing was first created or published (editable by admin)';
COMMENT ON COLUMN public.garage_owners.subscription_date IS 'The date when the subscription was activated / payment received (editable by admin)';