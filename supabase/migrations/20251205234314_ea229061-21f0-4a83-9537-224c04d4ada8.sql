-- Allow users to update their own reviews
CREATE POLICY "Users can update own reviews"
ON public.user_reviews
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own reviews
CREATE POLICY "Users can delete own reviews"
ON public.user_reviews
FOR DELETE
USING (auth.uid() = user_id);