-- Create storage bucket for claim documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('claim-documents', 'claim-documents', false);

-- Allow authenticated users to upload claim documents
CREATE POLICY "Users can upload claim documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'claim-documents' AND
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view their own claim documents
CREATE POLICY "Users can view own claim documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'claim-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow admins to view all claim documents
CREATE POLICY "Admins can view all claim documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'claim-documents' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Allow users to delete their own claim documents
CREATE POLICY "Users can delete own claim documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'claim-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);