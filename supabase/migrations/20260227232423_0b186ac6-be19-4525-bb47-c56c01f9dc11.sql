
-- Property alerts: stores saved search criteria per user
CREATE TABLE public.property_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL DEFAULT 'My Alert',
  location text,
  listing_type text,
  property_type text,
  min_bedrooms integer,
  min_bathrooms integer,
  min_price bigint,
  max_price bigint,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Alert notifications: generated when a new property matches an alert
CREATE TABLE public.alert_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_id uuid NOT NULL REFERENCES public.property_alerts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  property_id uuid NOT NULL,
  property_title text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS for property_alerts
ALTER TABLE public.property_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own alerts"
  ON public.property_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own alerts"
  ON public.property_alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts"
  ON public.property_alerts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own alerts"
  ON public.property_alerts FOR DELETE
  USING (auth.uid() = user_id);

-- RLS for alert_notifications
ALTER TABLE public.alert_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.alert_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.alert_notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON public.alert_notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Service role can insert notifications (from edge function)
CREATE POLICY "Service role can insert notifications"
  ON public.alert_notifications FOR INSERT
  WITH CHECK (true);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.alert_notifications;
