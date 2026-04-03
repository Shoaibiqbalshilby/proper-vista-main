-- Optimize one-to-one conversation reads and unread updates for web/mobile chat
CREATE INDEX IF NOT EXISTS idx_messages_sender_created_at
ON public.messages (sender_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_recipient_created_at
ON public.messages (recipient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_property_participants_created_at
ON public.messages (property_id, sender_id, recipient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_unread_recipient
ON public.messages (recipient_id, is_read, created_at DESC);

-- Ensure realtime keeps tracking public.messages for insert/update events
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_publication_tables
		WHERE pubname = 'supabase_realtime'
			AND schemaname = 'public'
			AND tablename = 'messages'
	) THEN
		ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
	END IF;
END $$;
