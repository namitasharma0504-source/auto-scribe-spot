-- Add phone column to profiles table for customer phone numbers
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;