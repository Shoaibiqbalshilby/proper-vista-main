
-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id TEXT NOT NULL,
  property_title TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  sender_phone TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Recipients can view their messages
CREATE POLICY "Recipients can view their messages"
ON public.messages FOR SELECT
USING (auth.uid() = recipient_id);

-- Senders can view their sent messages
CREATE POLICY "Senders can view their sent messages"
ON public.messages FOR SELECT
USING (auth.uid() = sender_id);

-- Authenticated users can send messages
CREATE POLICY "Authenticated users can send messages"
ON public.messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- Recipients can update (mark as read)
CREATE POLICY "Recipients can update their messages"
ON public.messages FOR UPDATE
USING (auth.uid() = recipient_id);
