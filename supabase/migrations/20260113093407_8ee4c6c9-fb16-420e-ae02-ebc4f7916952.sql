-- Drop the existing unique constraint that allows multiple roles per user
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;

-- Add a new unique constraint on just user_id to ensure one user = one role
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_unique UNIQUE (user_id);

-- Create a function to check if an email already has a role assigned
CREATE OR REPLACE FUNCTION public.check_email_role_conflict(check_email TEXT)
RETURNS TABLE(has_conflict BOOLEAN, existing_role TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_role TEXT;
BEGIN
  -- Find if user exists with this email
  SELECT au.id INTO v_user_id
  FROM auth.users au
  WHERE au.email = check_email;
  
  IF v_user_id IS NULL THEN
    -- No user with this email exists
    RETURN QUERY SELECT FALSE, NULL::TEXT;
    RETURN;
  END IF;
  
  -- Check if user has a role
  SELECT ur.role::TEXT INTO v_role
  FROM public.user_roles ur
  WHERE ur.user_id = v_user_id;
  
  IF v_role IS NOT NULL THEN
    RETURN QUERY SELECT TRUE, v_role;
  ELSE
    RETURN QUERY SELECT FALSE, NULL::TEXT;
  END IF;
END;
$$;