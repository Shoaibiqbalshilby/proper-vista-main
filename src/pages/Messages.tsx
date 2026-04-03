import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Check, CheckCheck, Clock, Home as HomeIcon, MessageSquare, Send, User } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type MessageRow = Database["public"]["Tables"]["messages"]["Row"];
type ProfileRow = Pick<Database["public"]["Tables"]["profiles"]["Row"], "user_id" | "full_name" | "phone" | "avatar_url">;
type ChatMessage = MessageRow & { _clientStatus?: "sending" };

type Conversation = {
  key: string;
  counterpartId: string;
  counterpartName: string;
  counterpartPhone: string | null;
  counterpartAvatar: string | null;
  counterpartEmail: string | null;
  propertyId: string;
  propertyTitle: string;
  messages: ChatMessage[];
  lastMessage: ChatMessage;
  unreadCount: number;
};

const getMetadataText = (value: unknown) => (typeof value === "string" ? value : null);

const buildConversationKey = (propertyId: string, firstUserId: string, secondUserId: string) =>
  `${propertyId}:${[firstUserId, secondUserId].sort().join(":")}`;

const sortMessages = (messages: ChatMessage[]) =>
  [...messages].sort((left, right) => new Date(left.created_at).getTime() - new Date(right.created_at).getTime());

const sameOptimisticMessage = (left: ChatMessage, right: MessageRow) =>
  left._clientStatus === "sending" &&
  left.sender_id === right.sender_id &&
  left.recipient_id === right.recipient_id &&
  left.property_id === right.property_id &&
  left.message === right.message;

const mergeIncomingMessage = (messages: ChatMessage[], nextMessage: MessageRow) => {
  const existingIndex = messages.findIndex((message) => message.id === nextMessage.id);

  if (existingIndex >= 0) {
    const updatedMessages = [...messages];
    updatedMessages[existingIndex] = { ...updatedMessages[existingIndex], ...nextMessage };
    return sortMessages(updatedMessages);
  }

  const filteredMessages = messages.filter((message) => !sameOptimisticMessage(message, nextMessage));
  return sortMessages([...filteredMessages, nextMessage]);
};

const isMessageForCurrentUser = (message: MessageRow, currentUserId: string) =>
  message.sender_id === currentUserId || message.recipient_id === currentUserId;

const Messages = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [fetching, setFetching] = useState(true);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<ProfileRow | null>(null);
  const [counterpartProfiles, setCounterpartProfiles] = useState<Record<string, ProfileRow>>({});
  const initialLoadDoneRef = useRef(false);

  useEffect(() => {
    if (!user) {
      setMessages([]);
      setCounterpartProfiles({});
      setCurrentProfile(null);
      setFetching(false);
      return;
    }

    let ignore = false;

    const ensureCounterpartProfile = async (counterpartId: string) => {
      if (!counterpartId || counterpartId === user.id) return;

      setCounterpartProfiles((prev) => {
        if (prev[counterpartId]) return prev;
        return prev;
      });

      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name, phone, avatar_url")
        .eq("user_id", counterpartId)
        .maybeSingle();

      if (!ignore && data) {
        setCounterpartProfiles((prev) => ({ ...prev, [counterpartId]: data }));
      }
    };

    const syncMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order("created_at", { ascending: true });

      if (ignore || error) return;

      const latestMessages = sortMessages(data ?? []);
      setMessages((prev) => {
        const pendingMessages = prev.filter((message) => message._clientStatus === "sending");
        let mergedMessages = prev.filter((message) => message._clientStatus !== "sending");

        for (const message of latestMessages) {
          mergedMessages = mergeIncomingMessage(mergedMessages, message);
        }

        return sortMessages([...mergedMessages, ...pendingMessages]);
      });
    };

    const fetchMessages = async (options?: { silent?: boolean }) => {
      const silent = options?.silent === true;

      if (!silent) setFetching(true);

      const [messagesRes, currentProfileRes] = await Promise.all([
        supabase
          .from("messages")
          .select("*")
          .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
          .order("created_at", { ascending: true }),
        supabase
          .from("profiles")
          .select("user_id, full_name, phone, avatar_url")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

      if (ignore) return;

      if (messagesRes.error) {
        if (!silent) {
          toast({
            title: "Unable to load messages",
            description: messagesRes.error.message,
            variant: "destructive",
          });
        }
        if (!silent) setFetching(false);
        return;
      }

      const fetchedMessages = sortMessages(messagesRes.data ?? []);
      setMessages(fetchedMessages);
      setCurrentProfile(currentProfileRes.data ?? null);

      const counterpartIds = [...new Set(
        fetchedMessages
          .map((message) => (message.sender_id === user.id ? message.recipient_id : message.sender_id))
          .filter((id) => id !== user.id)
      )];

      if (counterpartIds.length > 0) {
        const { data: counterpartData } = await supabase
          .from("profiles")
          .select("user_id, full_name, phone, avatar_url")
          .in("user_id", counterpartIds);

        if (!ignore) {
          setCounterpartProfiles(
            Object.fromEntries((counterpartData ?? []).map((profile) => [profile.user_id, profile]))
          );
        }
      } else {
        setCounterpartProfiles({});
      }

      if (!silent) setFetching(false);
      initialLoadDoneRef.current = true;
    };

    void fetchMessages();

    const refreshTimer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void syncMessages();
      }
    }, 1000);

    const handleFocusSync = () => {
      if (initialLoadDoneRef.current) {
        void syncMessages();
      }
    };

    window.addEventListener("focus", handleFocusSync);
    document.addEventListener("visibilitychange", handleFocusSync);

    const channel = supabase
      .channel(`messages-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const nextMessage = payload.new as MessageRow;
          if (!isMessageForCurrentUser(nextMessage, user.id)) return;

          setMessages((prev) => mergeIncomingMessage(prev, nextMessage));
          const counterpartId = nextMessage.sender_id === user.id ? nextMessage.recipient_id : nextMessage.sender_id;
          void ensureCounterpartProfile(counterpartId);
          void syncMessages();
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages" },
        (payload) => {
          const nextMessage = payload.new as MessageRow;
          if (!isMessageForCurrentUser(nextMessage, user.id)) return;

          setMessages((prev) => mergeIncomingMessage(prev, nextMessage));
          void syncMessages();
        }
      )
      .subscribe();

    return () => {
      ignore = true;
      window.clearInterval(refreshTimer);
      window.removeEventListener("focus", handleFocusSync);
      document.removeEventListener("visibilitychange", handleFocusSync);
      supabase.removeChannel(channel);
    };
  }, [toast, user]);

  const conversations = useMemo(() => {
    if (!user) return [] as Conversation[];

    const grouped = new Map<string, ChatMessage[]>();

    for (const message of messages) {
      const key = buildConversationKey(message.property_id, message.sender_id, message.recipient_id);
      const existingMessages = grouped.get(key);
      if (existingMessages) {
        existingMessages.push(message);
      } else {
        grouped.set(key, [message]);
      }
    }

    return [...grouped.entries()]
      .map(([key, thread]) => {
        const orderedMessages = sortMessages(thread);
        const lastMessage = orderedMessages[orderedMessages.length - 1];
        const counterpartId = lastMessage.sender_id === user.id ? lastMessage.recipient_id : lastMessage.sender_id;
        const counterpartProfile = counterpartProfiles[counterpartId];
        const incomingMessage = orderedMessages.find((message) => message.sender_id === counterpartId) ?? null;

        return {
          key,
          counterpartId,
          counterpartName:
            counterpartProfile?.full_name ||
            incomingMessage?.sender_name ||
            (lastMessage.sender_id === user.id ? "Property Owner" : lastMessage.sender_name),
          counterpartPhone: counterpartProfile?.phone ?? incomingMessage?.sender_phone ?? null,
          counterpartAvatar: counterpartProfile?.avatar_url ?? null,
          counterpartEmail: incomingMessage?.sender_email ?? null,
          propertyId: lastMessage.property_id,
          propertyTitle: lastMessage.property_title,
          messages: orderedMessages,
          lastMessage,
          unreadCount: orderedMessages.filter(
            (message) => message.recipient_id === user.id && !message.is_read
          ).length,
        } satisfies Conversation;
      })
      .sort(
        (left, right) =>
          new Date(right.lastMessage.created_at).getTime() - new Date(left.lastMessage.created_at).getTime()
      );
  }, [counterpartProfiles, messages, user]);

  useEffect(() => {
    if (!selectedKey && conversations[0]) {
      setSelectedKey(conversations[0].key);
      return;
    }

    if (selectedKey && conversations.every((conversation) => conversation.key !== selectedKey)) {
      setSelectedKey(conversations[0]?.key ?? null);
    }
  }, [conversations, selectedKey]);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.key === selectedKey) ?? null,
    [conversations, selectedKey]
  );

  useEffect(() => {
    if (!user || !selectedConversation) return;

    const unreadIncomingIds = selectedConversation.messages
      .filter((message) => message.recipient_id === user.id && !message.is_read)
      .map((message) => message.id);

    if (unreadIncomingIds.length === 0) return;

    setMessages((prev) =>
      prev.map((message) =>
        unreadIncomingIds.includes(message.id) ? { ...message, is_read: true } : message
      )
    );

    void supabase.from("messages").update({ is_read: true }).in("id", unreadIncomingIds);
  }, [selectedConversation, user]);

  const handleReply = async () => {
    if (!user || !selectedConversation) return;

    const trimmedReply = replyText.trim();
    if (!trimmedReply) return;

    if (!user.email) {
      toast({
        title: "Unable to send reply",
        description: "Your account does not have an email address available.",
        variant: "destructive",
      });
      return;
    }

    const senderName =
      currentProfile?.full_name ||
      getMetadataText(user.user_metadata?.full_name) ||
      user.email.split("@")[0] ||
      "User";
    const senderPhone = currentProfile?.phone || getMetadataText(user.user_metadata?.phone);
    const optimisticId = `temp-${Date.now()}`;
    const optimisticMessage: ChatMessage = {
      id: optimisticId,
      sender_id: user.id,
      recipient_id: selectedConversation.counterpartId,
      property_id: selectedConversation.propertyId,
      property_title: selectedConversation.propertyTitle,
      sender_name: senderName,
      sender_email: user.email,
      sender_phone: senderPhone || null,
      message: trimmedReply,
      is_read: false,
      created_at: new Date().toISOString(),
      _clientStatus: "sending",
    };

    setSendingReply(true);
    setMessages((prev) => sortMessages([...prev, optimisticMessage]));
    setReplyText("");

    const { data, error } = await supabase
      .from("messages")
      .insert({
        sender_id: user.id,
        recipient_id: selectedConversation.counterpartId,
        property_id: selectedConversation.propertyId,
        property_title: selectedConversation.propertyTitle,
        sender_name: senderName,
        sender_email: user.email,
        sender_phone: senderPhone || null,
        message: trimmedReply,
      })
      .select("*")
      .single();

    setSendingReply(false);

    if (error) {
      setMessages((prev) => prev.filter((message) => message.id !== optimisticId));
      setReplyText(trimmedReply);
      toast({
        title: "Unable to send reply",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setMessages((prev) => mergeIncomingMessage(prev.filter((message) => message.id !== optimisticId), data));
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

  const unreadCount = conversations.reduce((count, conversation) => count + conversation.unreadCount, 0);

  return (
    <main className="container py-8">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Messages</h1>
        {unreadCount > 0 && <Badge variant="destructive">{unreadCount} new</Badge>}
      </div>

      {fetching ? (
        <p className="text-muted-foreground">Loading messages...</p>
      ) : conversations.length === 0 ? (
        <div className="mx-auto max-w-3xl py-12">
          <div className="rounded-3xl border border-border bg-gradient-to-br from-card to-secondary/30 p-8 md:p-10">
            <h2 className="font-display text-4xl font-bold text-foreground">No conversations yet</h2>
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
              Messages you send from property pages and replies from owners will appear here.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <Link to="/properties">
                <Button className="h-12 w-full gradient-warm border-0 text-primary-foreground text-base">Browse Properties</Button>
              </Link>
              <Link to="/my-properties">
                <Button variant="outline" className="h-12 w-full text-base">Open My Properties</Button>
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <div className="space-y-2 max-h-[72vh] overflow-y-auto pr-1">
            {conversations.map((conversation) => (
              <button
                key={conversation.key}
                onClick={() => setSelectedKey(conversation.key)}
                className={`w-full rounded-2xl border p-4 text-left transition-all ${
                  selectedConversation?.key === conversation.key
                    ? "border-primary bg-primary/5"
                    : conversation.unreadCount > 0
                    ? "border-primary/30 bg-card hover:bg-primary/5"
                    : "border-border bg-card hover:border-primary/30"
                }`}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={conversation.counterpartAvatar || undefined} alt={conversation.counterpartName} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {conversation.counterpartName
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">{conversation.counterpartName}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground truncate">
                          <HomeIcon className="h-3 w-3 shrink-0" />
                          {conversation.propertyTitle}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(conversation.lastMessage.created_at), { addSuffix: true })}
                      </span>
                    </div>

                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {conversation.lastMessage.sender_id === user.id ? "You: " : ""}
                      {conversation.lastMessage.message}
                    </p>

                    {conversation.unreadCount > 0 && (
                      <Badge variant="secondary" className="mt-3 bg-primary/10 text-primary">
                        {conversation.unreadCount} unread
                      </Badge>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="flex min-h-[560px] flex-col rounded-3xl border border-border bg-card">
            {selectedConversation ? (
              <>
                <div className="border-b border-border p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12 shrink-0">
                        <AvatarImage src={selectedConversation.counterpartAvatar || undefined} alt={selectedConversation.counterpartName} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {selectedConversation.counterpartName
                            .split(" ")
                            .map((part) => part[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-primary" />
                          <h2 className="font-display text-xl font-semibold text-foreground">
                            {selectedConversation.counterpartName}
                          </h2>
                        </div>
                        <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                          <HomeIcon className="h-3.5 w-3.5" />
                          {selectedConversation.propertyTitle}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {selectedConversation.counterpartEmail || "Email available after they reply"}
                          {selectedConversation.counterpartPhone ? ` · ${selectedConversation.counterpartPhone}` : ""}
                        </p>
                      </div>
                    </div>

                    <Link to={`/property/${selectedConversation.propertyId}`}>
                      <Button variant="outline" className="gap-2">
                        View Property <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto p-6">
                  {selectedConversation.messages.map((message) => {
                    const isOwnMessage = message.sender_id === user.id;
                    const isSending = message._clientStatus === "sending";
                    const isSeen = !isSending && message.is_read;
                    const timeTextColor = isOwnMessage ? "text-primary-foreground/80" : "text-muted-foreground";

                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                            isOwnMessage
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-foreground"
                          }`}
                        >
                          <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.message}</p>
                          <div className={`mt-2 flex items-center gap-1 text-xs ${timeTextColor}`}>
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                            {isOwnMessage && (
                              <span className="ml-1 inline-flex items-center" aria-label={isSeen ? "Viewed" : isSending ? "Sending" : "Delivered"}>
                                {isSending ? (
                                  <Check className="h-3.5 w-3.5" />
                                ) : (
                                  <CheckCheck className={`h-3.5 w-3.5 ${isSeen ? "text-sky-300" : ""}`} />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-border p-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      Reply in this conversation
                    </div>
                    <Textarea
                      value={replyText}
                      onChange={(event) => setReplyText(event.target.value)}
                      placeholder="Type your reply here..."
                      rows={4}
                      maxLength={1000}
                    />
                    <div className="flex justify-end">
                      <Button
                        onClick={handleReply}
                        className="gradient-warm border-0 text-primary-foreground gap-2"
                        disabled={sendingReply || replyText.trim().length === 0}
                      >
                        <Send className="h-4 w-4" />
                        {sendingReply ? "Sending..." : "Send Reply"}
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Select a conversation to read and reply.
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
};

export default Messages;
