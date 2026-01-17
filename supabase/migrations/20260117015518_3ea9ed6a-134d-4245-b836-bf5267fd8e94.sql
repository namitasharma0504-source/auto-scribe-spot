-- Allow authenticated users (including partners) to upload garage listing photos
CREATE POLICY "Users can upload garage listing photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'garage-photos' 
  AND (storage.foldername(name))[1] = 'garage-listings'
);