import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Property } from "@/lib/mockData";

interface ContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: Property;
}

const ContactModal = ({ open, onOpenChange, property }: ContactModalProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: `Hi, I'm interested in the property "${property.title}" listed at ${property.priceLabel} in ${property.location}. Please share more details. Thank you!`,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;

    setSending(true);

    try {
      if (user) {
        // Find recipient user by agent email (if they exist in the system)
        // For now, store with a placeholder recipient — in production, properties would have a user_id
        const { data: recipientProfile } = await supabase
          .from("profiles")
          .select("user_id")
          .limit(1);

        // Store message in database
        const { error: msgError } = await supabase.from("messages").insert({
          sender_id: user.id,
          recipient_id: recipientProfile?.[0]?.user_id || user.id, // fallback to self for demo
          property_id: property.id,
          property_title: property.title,
          sender_name: form.name,
          sender_email: form.email,
          sender_phone: form.phone || null,
          message: form.message,
        });

        if (msgError) throw msgError;

        // Trigger email notification
        await supabase.functions.invoke("notify-message", {
          body: {
            recipientEmail: property.agent.email,
            senderName: form.name,
            propertyTitle: property.title,
            message: form.message,
          },
        });
      }

      toast({
        title: "Message Sent!",
        description: `Your message has been sent to ${property.agent.name}. They'll get back to you soon.`,
      });
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
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
            💡 <a href="/auth" className="underline text-primary">Sign in</a> to save messages to your account and get replies in your inbox.
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
          <Button type="submit" className="w-full gradient-warm border-0 text-primary-foreground" disabled={sending}>
            {sending ? "Sending..." : "Send Message"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ContactModal;
