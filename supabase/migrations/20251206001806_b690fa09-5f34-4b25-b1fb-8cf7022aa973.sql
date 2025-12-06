-- Allow admins to read ALL reviews for moderation
CREATE POLICY "Admins can read all reviews"
ON public.user_reviews
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update any review (for status changes)
CREATE POLICY "Admins can update all reviews"
ON public.user_reviews
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to read all user roles
CREATE POLICY "Admins can read all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to manage user roles
CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to read all profiles for user management
CREATE POLICY "Admins can read all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));