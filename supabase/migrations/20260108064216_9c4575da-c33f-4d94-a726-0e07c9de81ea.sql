-- Enable pg_trgm extension for text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create rate limit function for reviews
CREATE OR REPLACE FUNCTION public.check_review_rate_limit()
RETURNS TRIGGER AS $$
DECLARE 
  review_count INT;
BEGIN
  SELECT COUNT(*) INTO review_count
  FROM public.user_reviews
  WHERE user_id = NEW.user_id
  AND created_at > NOW() - INTERVAL '24 hours';
  
  IF review_count >= 5 THEN
    RAISE EXCEPTION 'Rate limit exceeded: maximum 5 reviews per 24 hours';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for rate limiting reviews
CREATE TRIGGER check_review_rate_limit_trigger
BEFORE INSERT ON public.user_reviews
FOR EACH ROW
EXECUTE FUNCTION public.check_review_rate_limit();

-- Add indexes for better search performance with large datasets
CREATE INDEX IF NOT EXISTS idx_garages_name_trgm ON public.garages USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_garages_city ON public.garages(city);
CREATE INDEX IF NOT EXISTS idx_garages_state ON public.garages(state);
CREATE INDEX IF NOT EXISTS idx_garages_rating ON public.garages(rating DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_garages_country ON public.garages(country);