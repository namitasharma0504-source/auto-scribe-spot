-- Add subscription_active column to garage_owners table to control dashboard access
ALTER TABLE public.garage_owners
ADD COLUMN IF NOT EXISTS subscription_active boolean NOT NULL DEFAULT false;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_garage_owners_subscription_active ON public.garage_owners(subscription_active);

-- Comment for clarity
COMMENT ON COLUMN public.garage_owners.subscription_active IS 'Controls dashboard access. Admin can enable/disable this regardless of claim approval status.';