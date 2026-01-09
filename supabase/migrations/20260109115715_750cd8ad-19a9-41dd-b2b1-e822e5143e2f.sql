-- Add slug column to garages table
ALTER TABLE public.garages ADD COLUMN IF NOT EXISTS slug text;

-- Create function to generate URL-friendly slug from name
CREATE OR REPLACE FUNCTION public.generate_garage_slug(garage_name text)
RETURNS text
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  -- Convert to lowercase, replace spaces and special chars with hyphens
  base_slug := lower(trim(garage_name));
  base_slug := regexp_replace(base_slug, '[^a-z0-9\s-]', '', 'g');
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  
  -- Ensure slug is not empty
  IF base_slug = '' OR base_slug IS NULL THEN
    base_slug := 'garage';
  END IF;
  
  final_slug := base_slug;
  
  -- Check for duplicates and append counter if needed
  WHILE EXISTS (SELECT 1 FROM public.garages WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

-- Update existing garages with slugs
UPDATE public.garages 
SET slug = public.generate_garage_slug(name)
WHERE slug IS NULL;

-- Create trigger function to auto-generate slug on insert/update
CREATE OR REPLACE FUNCTION public.set_garage_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  -- Generate slug if not provided or if name changed
  IF NEW.slug IS NULL OR NEW.slug = '' OR (TG_OP = 'UPDATE' AND OLD.name != NEW.name) THEN
    NEW.slug := public.generate_garage_slug(NEW.name);
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for new garages
DROP TRIGGER IF EXISTS set_garage_slug_trigger ON public.garages;
CREATE TRIGGER set_garage_slug_trigger
  BEFORE INSERT OR UPDATE ON public.garages
  FOR EACH ROW
  EXECUTE FUNCTION public.set_garage_slug();

-- Add unique constraint on slug
ALTER TABLE public.garages ADD CONSTRAINT garages_slug_unique UNIQUE (slug);

-- Create index for faster slug lookups
CREATE INDEX IF NOT EXISTS idx_garages_slug ON public.garages(slug);