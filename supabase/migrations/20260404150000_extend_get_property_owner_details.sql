DROP FUNCTION IF EXISTS public.get_property_owner_details(uuid);

CREATE FUNCTION public.get_property_owner_details(p_property_id uuid)
RETURNS TABLE (
  owner_user_id uuid,
  owner_name text,
  owner_phone text,
  owner_company_name text,
  owner_email text,
  owner_avatar_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  has_profiles boolean := to_regclass('public.profiles') IS NOT NULL;
  has_business_profiles boolean := to_regclass('public.business_profiles') IS NOT NULL;
BEGIN
  IF has_profiles AND has_business_profiles THEN
    RETURN QUERY
    SELECT
      properties.user_id AS owner_user_id,
      COALESCE(NULLIF(profiles.full_name, ''), NULLIF(business_profiles.company_name, '')) AS owner_name,
      COALESCE(business_profiles.contact_phone, profiles.phone) AS owner_phone,
      business_profiles.company_name AS owner_company_name,
      NULLIF(auth_users.email, '') AS owner_email,
      NULLIF(profiles.avatar_url, '') AS owner_avatar_url
    FROM public.properties AS properties
    LEFT JOIN public.profiles AS profiles
      ON profiles.user_id = properties.user_id
    LEFT JOIN public.business_profiles AS business_profiles
      ON business_profiles.user_id = properties.user_id
    LEFT JOIN auth.users AS auth_users
      ON auth_users.id = properties.user_id
    WHERE properties.id = p_property_id
    LIMIT 1;
  ELSIF has_profiles THEN
    RETURN QUERY
    SELECT
      properties.user_id AS owner_user_id,
      NULLIF(profiles.full_name, '') AS owner_name,
      profiles.phone AS owner_phone,
      NULL::text AS owner_company_name,
      NULLIF(auth_users.email, '') AS owner_email,
      NULLIF(profiles.avatar_url, '') AS owner_avatar_url
    FROM public.properties AS properties
    LEFT JOIN public.profiles AS profiles
      ON profiles.user_id = properties.user_id
    LEFT JOIN auth.users AS auth_users
      ON auth_users.id = properties.user_id
    WHERE properties.id = p_property_id
    LIMIT 1;
  ELSIF has_business_profiles THEN
    RETURN QUERY
    SELECT
      properties.user_id AS owner_user_id,
      NULLIF(business_profiles.company_name, '') AS owner_name,
      business_profiles.contact_phone AS owner_phone,
      business_profiles.company_name AS owner_company_name,
      NULLIF(auth_users.email, '') AS owner_email,
      NULL::text AS owner_avatar_url
    FROM public.properties AS properties
    LEFT JOIN public.business_profiles AS business_profiles
      ON business_profiles.user_id = properties.user_id
    LEFT JOIN auth.users AS auth_users
      ON auth_users.id = properties.user_id
    WHERE properties.id = p_property_id
    LIMIT 1;
  ELSE
    RETURN QUERY
    SELECT
      properties.user_id AS owner_user_id,
      NULL::text AS owner_name,
      NULL::text AS owner_phone,
      NULL::text AS owner_company_name,
      NULLIF(auth_users.email, '') AS owner_email,
      NULL::text AS owner_avatar_url
    FROM public.properties AS properties
    LEFT JOIN auth.users AS auth_users
      ON auth_users.id = properties.user_id
    WHERE properties.id = p_property_id
    LIMIT 1;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_property_owner_details(uuid) TO anon, authenticated;