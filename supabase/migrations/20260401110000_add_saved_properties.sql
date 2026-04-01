-- Save properties per user
CREATE TABLE public.saved_properties (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  property_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT saved_properties_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT saved_properties_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE,
  CONSTRAINT saved_properties_user_property_unique UNIQUE (user_id, property_id)
);

ALTER TABLE public.saved_properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their saved properties"
ON public.saved_properties FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can save properties"
ON public.saved_properties FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove saved properties"
ON public.saved_properties FOR DELETE
USING (auth.uid() = user_id);

CREATE INDEX saved_properties_user_id_idx ON public.saved_properties(user_id);
CREATE INDEX saved_properties_property_id_idx ON public.saved_properties(property_id);
