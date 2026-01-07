-- Create garage claim requests table
CREATE TABLE public.garage_claim_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  garage_id UUID NOT NULL REFERENCES public.garages(id) ON DELETE CASCADE,
  claimant_user_id UUID NOT NULL,
  claimant_name TEXT NOT NULL,
  claimant_phone TEXT NOT NULL,
  claimant_email TEXT NOT NULL,
  business_proof TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.garage_claim_requests ENABLE ROW LEVEL SECURITY;

-- Users can submit claims for garages that don't have an owner
CREATE POLICY "Users can submit claim requests"
ON public.garage_claim_requests
FOR INSERT
WITH CHECK (
  auth.uid() = claimant_user_id AND
  EXISTS (
    SELECT 1 FROM public.garages g 
    WHERE g.id = garage_id AND g.owner_id IS NULL
  )
);

-- Users can view their own claim requests
CREATE POLICY "Users can view own claims"
ON public.garage_claim_requests
FOR SELECT
USING (auth.uid() = claimant_user_id);

-- Admins can view all claim requests
CREATE POLICY "Admins can view all claims"
ON public.garage_claim_requests
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Admins can update claim requests
CREATE POLICY "Admins can update claims"
ON public.garage_claim_requests
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Admins can delete claim requests
CREATE POLICY "Admins can delete claims"
ON public.garage_claim_requests
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_garage_claim_requests_updated_at
BEFORE UPDATE ON public.garage_claim_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_garage_claim_requests_garage_id ON public.garage_claim_requests(garage_id);
CREATE INDEX idx_garage_claim_requests_status ON public.garage_claim_requests(status);