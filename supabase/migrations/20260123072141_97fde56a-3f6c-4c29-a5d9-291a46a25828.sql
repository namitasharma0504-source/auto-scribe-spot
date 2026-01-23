-- Create app_settings table for admin-controlled platform settings
CREATE TABLE IF NOT EXISTS public.app_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings (needed for auth pages to check if signups are enabled)
CREATE POLICY "Anyone can read app settings"
ON public.app_settings
FOR SELECT
USING (true);

-- Only admins can modify settings
CREATE POLICY "Admins can manage app settings"
ON public.app_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default signup settings
INSERT INTO public.app_settings (key, value, description)
VALUES (
  'signup_settings',
  '{"customer_signup_enabled": true, "garage_signup_enabled": true, "partner_signup_enabled": true}'::jsonb,
  'Controls whether signups are enabled for each user type'
) ON CONFLICT (key) DO NOTHING;