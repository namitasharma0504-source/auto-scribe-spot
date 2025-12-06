-- Add admin policies to rewards_history table for oversight and fraud prevention

-- Allow admins to read all rewards history
CREATE POLICY "Admins can read all rewards history"
ON public.rewards_history FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Allow admins to update rewards history (for fraud cases)
CREATE POLICY "Admins can update rewards history"
ON public.rewards_history FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Allow admins to delete rewards history (for fraud cases)
CREATE POLICY "Admins can delete rewards history"
ON public.rewards_history FOR DELETE
USING (has_role(auth.uid(), 'admin'));