
-- Drop the overly permissive policy and replace with one that only allows authenticated service role inserts
-- The edge function uses the service role key which bypasses RLS, so we don't need an INSERT policy for regular users
DROP POLICY "Service role can insert notifications" ON public.alert_notifications;
