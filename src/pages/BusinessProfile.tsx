import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Building2, Loader2 } from "lucide-react";

const BusinessProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [companyName, setCompanyName] = useState("");
  const [description, setDescription] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [whatsAppNumber, setWhatsAppNumber] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    const loadBusinessProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("business_profiles")
        .select("company_name, description, contact_phone, whatsapp_number, address")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setCompanyName(data.company_name ?? "");
        setDescription(data.description ?? "");
        setContactPhone(data.contact_phone ?? "");
        setWhatsAppNumber(data.whatsapp_number ?? "");
        setAddress(data.address ?? "");
      }

      setLoading(false);
    };

    if (!authLoading) loadBusinessProfile();
  }, [authLoading, user]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    const { error } = await supabase.from("business_profiles").upsert(
      {
        user_id: user.id,
        company_name: companyName.trim(),
        description: description.trim(),
        contact_phone: contactPhone.trim(),
        whatsapp_number: whatsAppNumber.trim(),
        address: address.trim(),
      },
      { onConflict: "user_id" }
    );

    setSaving(false);

    if (error) {
      toast({
        title: "Unable to save",
        description: "Please try again.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Saved",
      description: "Business profile updated successfully.",
    });
  };

  if (authLoading || loading) {
    return (
      <main className="container py-16">
        <p className="text-muted-foreground">Loading business profile...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="container py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-foreground mb-4">Sign In Required</h1>
        <p className="text-muted-foreground mb-6">Please sign in to manage your business profile.</p>
        <Link to="/auth"><Button>Sign In</Button></Link>
      </main>
    );
  }

  return (
    <main className="container py-8">
      <div className="mx-auto max-w-4xl">
        <Link to="/settings" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Settings
        </Link>

        <div className="mt-4 rounded-2xl border border-border bg-gradient-to-br from-card to-secondary/30 p-6 md:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">Business Profile</h1>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                Fill out your company details so buyers can trust your listings and contact you easily.
              </p>
            </div>
          </div>

          <form className="mt-8 grid gap-6" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Enter company name" maxLength={120} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell clients about your company"
                rows={5}
                maxLength={1200}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input id="contactPhone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="e.g. +2348012345678" maxLength={40} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="whatsapp">WhatsApp Number</Label>
                <Input id="whatsapp" value={whatsAppNumber} onChange={(e) => setWhatsAppNumber(e.target.value)} placeholder="e.g. +2348012345678" maxLength={40} />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Company address" maxLength={220} />
            </div>

            <div className="flex justify-end">
              <Button type="submit" className="min-w-44 gradient-warm border-0 text-primary-foreground" disabled={saving}>
                {saving ? (
                  <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Saving...</span>
                ) : (
                  "Save Profile"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
};

export default BusinessProfile;
