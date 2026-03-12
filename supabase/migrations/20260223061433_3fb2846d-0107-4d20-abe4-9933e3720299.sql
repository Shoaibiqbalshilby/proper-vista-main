
-- Create properties table
CREATE TABLE public.properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price BIGINT NOT NULL,
  price_label TEXT NOT NULL,
  property_type TEXT NOT NULL CHECK (property_type IN ('house', 'apartment', 'villa', 'land', 'condo')),
  listing_type TEXT NOT NULL CHECK (listing_type IN ('sale', 'rent', 'short-let')),
  location TEXT NOT NULL,
  address TEXT NOT NULL,
  bedrooms INTEGER NOT NULL DEFAULT 0,
  bathrooms INTEGER NOT NULL DEFAULT 0,
  area INTEGER NOT NULL DEFAULT 0,
  images TEXT[] NOT NULL DEFAULT '{}',
  features TEXT[] NOT NULL DEFAULT '{}',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Anyone can view properties
CREATE POLICY "Properties are publicly readable"
ON public.properties FOR SELECT
USING (true);

-- Owners can insert their own properties
CREATE POLICY "Users can insert their own properties"
ON public.properties FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Owners can update their own properties
CREATE POLICY "Users can update their own properties"
ON public.properties FOR UPDATE
USING (auth.uid() = user_id);

-- Owners can delete their own properties
CREATE POLICY "Users can delete their own properties"
ON public.properties FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_properties_updated_at
BEFORE UPDATE ON public.properties
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.properties;

-- Update profiles: allow public read of non-sensitive fields
-- Drop the restrictive select policy and replace with public read
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Profiles are publicly readable"
ON public.profiles FOR SELECT
USING (true);
