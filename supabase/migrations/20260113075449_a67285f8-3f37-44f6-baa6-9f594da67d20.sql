-- Create storage bucket for partner documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('partner-documents', 'partner-documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for partner documents bucket
-- Partners can upload their own documents
CREATE POLICY "Partners can upload own documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'partner-documents' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Partners can view their own documents
CREATE POLICY "Partners can view own documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'partner-documents' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Partners can update their own documents
CREATE POLICY "Partners can update own documents"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'partner-documents' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Partners can delete their own documents
CREATE POLICY "Partners can delete own documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'partner-documents' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Admins can view all partner documents
CREATE POLICY "Admins can view all partner documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'partner-documents'
  AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);