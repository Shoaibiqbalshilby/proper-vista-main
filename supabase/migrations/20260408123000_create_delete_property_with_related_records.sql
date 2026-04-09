CREATE OR REPLACE FUNCTION public.delete_property_with_related_records(p_property_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  property_owner_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT user_id
  INTO property_owner_id
  FROM public.properties
  WHERE id = p_property_id;

  IF property_owner_id IS NULL THEN
    RAISE EXCEPTION 'Property not found';
  END IF;

  IF property_owner_id <> auth.uid() THEN
    RAISE EXCEPTION 'You can only delete your own properties';
  END IF;

  DELETE FROM public.alert_notifications
  WHERE property_id = p_property_id;

  DELETE FROM public.messages
  WHERE property_id = p_property_id::text;

  DELETE FROM public.properties
  WHERE id = p_property_id
    AND user_id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_property_with_related_records(uuid) TO authenticated;