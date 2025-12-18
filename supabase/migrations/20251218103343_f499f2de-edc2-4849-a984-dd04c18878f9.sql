-- Fix 1: Add database constraints for review input validation
-- Using triggers instead of CHECK constraints for better flexibility

-- Add constraints for user_reviews table
ALTER TABLE public.user_reviews 
ADD CONSTRAINT rating_range CHECK (rating >= 1 AND rating <= 5);

-- Create validation trigger function for user_reviews
CREATE OR REPLACE FUNCTION public.validate_user_review()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate garage_name length
  IF NEW.garage_name IS NULL OR length(trim(NEW.garage_name)) < 2 THEN
    RAISE EXCEPTION 'Garage name must be at least 2 characters';
  END IF;
  
  IF length(NEW.garage_name) > 200 THEN
    RAISE EXCEPTION 'Garage name must be less than 200 characters';
  END IF;
  
  -- Validate review_text length (if provided)
  IF NEW.review_text IS NOT NULL THEN
    IF length(trim(NEW.review_text)) < 20 THEN
      RAISE EXCEPTION 'Review text must be at least 20 characters';
    END IF;
    
    IF length(NEW.review_text) > 2000 THEN
      RAISE EXCEPTION 'Review text must be less than 2000 characters';
    END IF;
  END IF;
  
  -- Validate garage_location length (if provided)
  IF NEW.garage_location IS NOT NULL AND length(NEW.garage_location) > 300 THEN
    RAISE EXCEPTION 'Garage location must be less than 300 characters';
  END IF;
  
  -- Trim whitespace
  NEW.garage_name = trim(NEW.garage_name);
  IF NEW.review_text IS NOT NULL THEN
    NEW.review_text = trim(NEW.review_text);
  END IF;
  IF NEW.garage_location IS NOT NULL THEN
    NEW.garage_location = trim(NEW.garage_location);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for review validation
DROP TRIGGER IF EXISTS validate_review_trigger ON public.user_reviews;
CREATE TRIGGER validate_review_trigger
BEFORE INSERT OR UPDATE ON public.user_reviews
FOR EACH ROW EXECUTE FUNCTION public.validate_user_review();

-- Fix 2: Update has_role function to add caller validation
-- This prevents role enumeration attacks by only allowing users to check their own role
-- or admins to check any role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow checking own role or if caller is admin
  IF _user_id != auth.uid() THEN
    -- Check if caller is admin (direct query to avoid recursion)
    IF NOT EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    ) THEN
      -- Return false instead of raising exception for better UX
      -- This prevents information leakage about other users' roles
      RETURN false;
    END IF;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$$;