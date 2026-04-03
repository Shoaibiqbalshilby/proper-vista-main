import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Property } from "@/lib/mockData";

interface ContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: Property;
}

const getDefaultMessage = (property: Property) =>
  `Hi, I'm interested in the property "${property.title}" listed at ${property.priceLabel} in ${property.location}. Please share more details. Thank you!`;

const getUserMetadataText = (value: unknown) => (typeof value === "string" ? value : "");

const ContactModal = ({ open, onOpenChange, property }: ContactModalProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: getDefaultMessage(property),
  });

  useEffect(() => {
    setForm((currentForm) => ({
      ...currentForm,
      message: getDefaultMessage(property),
    }));
  }, [property.id, property.location, property.priceLabel, property.title]);

  useEffect(() => {
    if (!user) {
      setForm((currentForm) => ({
        ...currentForm,
        name: "",
        email: "",
        phone: "",
      }));
      return;
    }

    let ignore = false;

    const loadSenderProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("user_id", user.id)
        .maybeSingle();

      if (ignore) return;

      setForm((currentForm) => ({
        ...currentForm,
        name:
          currentForm.name ||
          data?.full_name ||
          getUserMetadataText(user.user_metadata?.full_name) ||
          user.email?.split("@")[0] ||
          "",
        email: currentForm.email || user.email || "",
        phone: currentForm.phone || data?.phone || getUserMetadataText(user.user_metadata?.phone),
      }));
    };

    void loadSenderProfile();

    return () => {
      ignore = true;
    };
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to send messages and receive replies on the website.",
        variant: "destructive",
      });
      return;
    }

    if (!property.userId) {
      toast({
        title: "Messaging unavailable",
        description: "This listing is not linked to a website account yet, so in-app messaging is not available.",
        variant: "destructive",
      });
      return;
    }

    if (property.userId === user.id) {
      toast({
        title: "Cannot message yourself",
        description: "Open your Messages inbox to view buyer conversations for this listing.",
        variant: "destructive",
      });
      return;
    }

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast({
        title: "Missing details",
        description: "Name, email, and message are required.",
        variant: "destructive",
      });
      return;
    }

    setSending(true);

    try {
      const { error: msgError } = await supabase.from("messages").insert({
        sender_id: user.id,
        recipient_id: property.userId,
        property_id: property.id,
        property_title: property.title,
        sender_name: form.name.trim(),
        sender_email: form.email.trim(),
        sender_phone: form.phone.trim() || null,
        message: form.message.trim(),
      });

      if (msgError) throw msgError;

      if (property.agent.email) {
        await supabase.functions
          .invoke("notify-message", {
            body: {
              recipientEmail: property.agent.email,
              senderName: form.name.trim(),
              propertyTitle: property.title,
              message: form.message.trim(),
            },
          })
          .catch(() => undefined);
      }

      toast({
        title: "Message Sent!",
        description: `Your message has been saved and sent to ${property.agent.name || "the property owner"}. Replies will appear in your Messages inbox.`,
      });
      setForm((currentForm) => ({
        ...currentForm,
        message: getDefaultMessage(property),
      }));
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Contact Agent</DialogTitle>
          <DialogDescription>
            Send a message to {property.agent.name} at {property.agent.company}
          </DialogDescription>
        </DialogHeader>
        {!user && (
          <p className="text-sm text-muted-foreground bg-muted/50 rounded-md p-3">
            <Link to="/auth" className="underline text-primary">Sign in</Link> to save messages to your account and receive replies in your website inbox.
          </p>
        )}
        {user && !property.userId && (
          <p className="text-sm text-muted-foreground bg-muted/50 rounded-md p-3">
            This listing is not linked to a website owner account yet, so message threads cannot be created from the web app.
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contact-name">Your Name *</Label>
            <Input
              id="contact-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Full name"
              required
              maxLength={100}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-email">Email *</Label>
            <Input
              id="contact-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@email.com"
              required
              maxLength={255}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-phone">Phone</Label>
            <Input
              id="contact-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+1 (555) 000-0000"
              maxLength={20}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-message">Message</Label>
            <Textarea
              id="contact-message"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              rows={4}
              maxLength={1000}
            />
          </div>
          <Button type="submit" className="w-full gradient-warm border-0 text-primary-foreground" disabled={sending || !property.userId || !user}>
            {sending ? "Sending..." : "Send Message"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ContactModal;
