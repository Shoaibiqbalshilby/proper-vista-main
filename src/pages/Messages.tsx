import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, MailOpen, ArrowLeft, Clock, Home as HomeIcon, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  property_id: string;
  property_title: string;
  sender_name: string;
  sender_email: string;
  sender_phone: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

const Messages = () => {
  const { user, loading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [fetching, setFetching] = useState(true);
  const [selected, setSelected] = useState<Message | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("recipient_id", user.id)
        .order("created_at", { ascending: false });
      if (!error && data) setMessages(data);
      setFetching(false);
    };
    fetchMessages();

    // Realtime subscription
    const channel = supabase
      .channel("messages-inbox")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `recipient_id=eq.${user.id}` },
        (payload) => {
          setMessages((prev) => [payload.new as Message, ...prev]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const markAsRead = async (msg: Message) => {
    setSelected(msg);
    if (!msg.is_read) {
      await supabase.from("messages").update({ is_read: true }).eq("id", msg.id);
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, is_read: true } : m)));
    }
  };

  if (loading) return <main className="container py-20 text-center text-muted-foreground">Loading...</main>;

  if (!user) {
    return (
      <main className="container py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-foreground mb-4">Sign In Required</h1>
        <p className="text-muted-foreground mb-6">Please sign in to view your messages.</p>
        <Link to="/auth"><Button>Sign In</Button></Link>
      </main>
    );
  }

  const unreadCount = messages.filter((m) => !m.is_read).length;

  return (
    <main className="container py-8">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Messages</h1>
        {unreadCount > 0 && (
          <Badge variant="destructive">{unreadCount} new</Badge>
        )}
      </div>

      {fetching ? (
        <p className="text-muted-foreground">Loading messages...</p>
      ) : messages.length === 0 ? (
        <div className="text-center py-16">
          <Mail className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
          <p className="text-muted-foreground">No messages yet.</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
          {/* Message list */}
          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
            {messages.map((msg) => (
              <button
                key={msg.id}
                onClick={() => markAsRead(msg)}
                className={`w-full text-left rounded-lg border p-4 transition-all ${
                  selected?.id === msg.id
                    ? "border-primary bg-primary/5"
                    : msg.is_read
                    ? "border-border bg-card hover:border-primary/30"
                    : "border-primary/40 bg-primary/5 hover:bg-primary/10"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {msg.is_read ? (
                      <MailOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                    ) : (
                      <Mail className="h-4 w-4 text-primary shrink-0" />
                    )}
                    <span className={`text-sm truncate ${msg.is_read ? "text-foreground" : "font-semibold text-foreground"}`}>
                      {msg.sender_name}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <HomeIcon className="h-3 w-3" /> {msg.property_title}
                </p>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{msg.message}</p>
              </button>
            ))}
          </div>

          {/* Message detail */}
          <div className="rounded-lg border border-border bg-card p-6 min-h-[300px]">
            {selected ? (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <User className="h-5 w-5 text-primary" />
                  <h2 className="font-display text-lg font-semibold text-foreground">{selected.sender_name}</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-1">{selected.sender_email}{selected.sender_phone ? ` · ${selected.sender_phone}` : ""}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mb-4">
                  <HomeIcon className="h-3 w-3" /> Re: {selected.property_title}
                  <span className="ml-2 flex items-center gap-1"><Clock className="h-3 w-3" /> {formatDistanceToNow(new Date(selected.created_at), { addSuffix: true })}</span>
                </p>
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-foreground whitespace-pre-wrap leading-relaxed">{selected.message}</p>
                </div>
                <Link to={`/property/${selected.property_id}`}>
                  <Button variant="outline" size="sm" className="mt-4 gap-1">
                    <ArrowLeft className="h-3 w-3" /> View Property
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Select a message to read
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
};

export default Messages;
