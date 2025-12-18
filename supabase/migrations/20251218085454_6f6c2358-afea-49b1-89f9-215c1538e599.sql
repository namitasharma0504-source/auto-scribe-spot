-- Create storage bucket for garage photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('garage-photos', 'garage-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to garage photos
CREATE POLICY "Anyone can view garage photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'garage-photos');

-- Allow admins to upload garage photos
CREATE POLICY "Admins can upload garage photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'garage-photos' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Allow admins to update garage photos
CREATE POLICY "Admins can update garage photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'garage-photos' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Allow admins to delete garage photos
CREATE POLICY "Admins can delete garage photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'garage-photos' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Create garage_photos table to store multiple photos per garage
CREATE TABLE public.garage_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  garage_id UUID NOT NULL REFERENCES public.garages(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on garage_photos
ALTER TABLE public.garage_photos ENABLE ROW LEVEL SECURITY;

-- Anyone can view garage photos
CREATE POLICY "Anyone can view garage photos table"
ON public.garage_photos FOR SELECT
USING (true);

-- Admins can manage garage photos
CREATE POLICY "Admins can insert garage photos"
ON public.garage_photos FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Admins can update garage photos"
ON public.garage_photos FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete garage photos"
ON public.garage_photos FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Create index for faster lookups
CREATE INDEX idx_garage_photos_garage_id ON public.garage_photos(garage_id);