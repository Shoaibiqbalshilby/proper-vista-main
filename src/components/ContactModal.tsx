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

type PropertyOwnerDetails = {
  userId: string;
  fullName: string | null;
  phone: string | null;
  companyName: string | null;
  email: string | null;
  avatarUrl: string | null;
};

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
  const [ownerDetails, setOwnerDetails] = useState<PropertyOwnerDetails | null>(null);
  const [ownerLoading, setOwnerLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: getDefaultMessage(property),
  });
  const ownerName = ownerDetails?.fullName || property.agent.name || "Property Owner";
  const ownerCompany = ownerDetails?.companyName || property.agent.company || null;
  const ownerPhone = ownerDetails?.phone || property.agent.phone || null;
  const ownerEmail = ownerDetails?.email || property.agent.email || null;

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

  useEffect(() => {
    if (!open) return;

    let ignore = false;
    setOwnerDetails(null);

    const loadOwnerDetails = async () => {
      setOwnerLoading(true);

      const { data, error } = await supabase.rpc("get_property_owner_details", {
        p_property_id: property.id,
      });

      if (ignore) return;

      if (error) {
        setOwnerDetails(null);
        setOwnerLoading(false);
        return;
      }

      const ownerData = data?.[0] ?? null;
      const ownerUserId = ownerData?.owner_user_id ?? property.userId ?? null;

      if (!ownerUserId) {
        setOwnerDetails(null);
        setOwnerLoading(false);
        return;
      }

      if (ignore) return;

      setOwnerDetails({
        userId: ownerUserId,
        fullName: ownerData?.owner_name ?? ownerData?.owner_company_name ?? property.agent.name ?? null,
        phone: ownerData?.owner_phone ?? property.agent.phone ?? null,
        companyName: ownerData?.owner_company_name ?? property.agent.company ?? null,
        email: ownerData?.owner_email ?? property.agent.email ?? null,
        avatarUrl: ownerData?.owner_avatar_url ?? property.agent.avatar ?? null,
      });
      setOwnerLoading(false);
    };

    void loadOwnerDetails();

    return () => {
      ignore = true;
    };
  }, [open, property.agent.avatar, property.agent.company, property.agent.email, property.agent.name, property.agent.phone, property.id, property.userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const recipientUserId = ownerLoading ? null : ownerDetails?.userId ?? property.userId ?? null;

    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to send messages and receive replies on the website.",
        variant: "destructive",
      });
      return;
    }

    if (!recipientUserId) {
      toast({
        title: "Messaging unavailable",
        description: "This listing is not linked to a website account yet, so in-app messaging is not available.",
        variant: "destructive",
      });
      return;
    }

    if (recipientUserId === user.id) {
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
        recipient_id: recipientUserId,
        property_id: property.id,
        property_title: property.title,
        sender_name: form.name.trim(),
        sender_email: form.email.trim(),
        sender_phone: form.phone.trim() || null,
        message: form.message.trim(),
      });

      if (msgError) throw msgError;

      const recipientEmail = ownerDetails?.email || property.agent.email;

      if (recipientEmail) {
        await supabase.functions
          .invoke("notify-message", {
            body: {
              recipientEmail,
              senderName: form.name.trim(),
              propertyTitle: property.title,
              message: form.message.trim(),
            },
          })
          .catch(() => undefined);
      }

      toast({
        title: "Message Sent!",
        description: `Your message has been saved and sent to ${ownerName}. Replies will appear in your Messages inbox.`,
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
          <DialogTitle className="font-display">Contact Property Owner</DialogTitle>
          <DialogDescription>
            Send a message to {ownerName}{ownerCompany ? ` at ${ownerCompany}` : ""}
          </DialogDescription>
        </DialogHeader>
        {!user && (
          <p className="text-sm text-muted-foreground bg-muted/50 rounded-md p-3">
            <Link to="/auth" className="underline text-primary">Sign in</Link> to save messages to your account and receive replies in your website inbox.
          </p>
        )}
        {user && !ownerLoading && !ownerDetails?.userId && !property.userId && (
          <p className="text-sm text-muted-foreground bg-muted/50 rounded-md p-3">
            This listing is not linked to a website owner account yet, so message threads cannot be created from the web app.
          </p>
        )}
        {user && ownerLoading && (
          <p className="text-sm text-muted-foreground bg-muted/50 rounded-md p-3">
            Loading property owner details...
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          {user && !ownerLoading && (ownerDetails?.userId ?? property.userId) && (
            <div className="rounded-md border border-border bg-muted/40 p-3 text-sm">
              <p className="font-medium text-foreground">Message recipient</p>
              <p className="mt-1 text-muted-foreground">This message will be delivered to the property owner account for this listing.</p>
              <div className="mt-2 space-y-1 text-foreground">
                <p>{ownerName}</p>
                {ownerCompany && <p className="text-muted-foreground">{ownerCompany}</p>}
                {ownerPhone && <p className="text-muted-foreground">{ownerPhone}</p>}
                {ownerEmail && <p className="text-muted-foreground">{ownerEmail}</p>}
              </div>
            </div>
          )}
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
          <Button
            type="submit"
            className="w-full gradient-warm border-0 text-primary-foreground"
            disabled={sending || ownerLoading || !(ownerDetails?.userId ?? property.userId) || !user}
          >
            {sending ? "Sending..." : "Send Message"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ContactModal;
