-- Create webinar_slots table for admin-managed webinar scheduling
CREATE TABLE public.webinar_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_date date NOT NULL,
  start_time time NOT NULL DEFAULT '16:00:00',
  end_time time NOT NULL DEFAULT '17:00:00',
  is_full boolean NOT NULL DEFAULT false,
  max_capacity integer DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.webinar_slots ENABLE ROW LEVEL SECURITY;

-- Anyone can view webinar slots (for the public page)
CREATE POLICY "Anyone can view webinar slots"
ON public.webinar_slots
FOR SELECT
USING (true);

-- Only admins can manage webinar slots
CREATE POLICY "Admins can manage webinar slots"
ON public.webinar_slots
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_webinar_slots_updated_at
BEFORE UPDATE ON public.webinar_slots
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial slots based on current hardcoded data
INSERT INTO public.webinar_slots (slot_date, start_time, end_time, is_full) VALUES
('2026-01-24', '16:00:00', '17:00:00', false),
('2026-01-25', '16:00:00', '17:00:00', true);