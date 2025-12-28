-- Create verification requests table
CREATE TABLE public.verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  garage_id uuid NOT NULL REFERENCES public.garages(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  request_message text,
  admin_notes text,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(garage_id, status)
);

-- Enable RLS
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

-- Garage owners can view their own requests
CREATE POLICY "Garage owners can view their verification requests"
ON public.verification_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM garages g 
    WHERE g.id = verification_requests.garage_id 
    AND g.owner_id = auth.uid()
  )
);

-- Garage owners can insert requests for their garage
CREATE POLICY "Garage owners can create verification requests"
ON public.verification_requests
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM garages g 
    WHERE g.id = verification_requests.garage_id 
    AND g.owner_id = auth.uid()
  )
  AND requested_by = auth.uid()
);

-- Admins can view all requests
CREATE POLICY "Admins can view all verification requests"
ON public.verification_requests
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update requests
CREATE POLICY "Admins can update verification requests"
ON public.verification_requests
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete requests
CREATE POLICY "Admins can delete verification requests"
ON public.verification_requests
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_verification_requests_updated_at
BEFORE UPDATE ON public.verification_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();