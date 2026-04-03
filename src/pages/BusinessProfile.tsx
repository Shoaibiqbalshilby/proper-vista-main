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

type BusinessProfileRow = {
  id: string;
  company_name: string | null;
  description: string | null;
  contact_phone: string | null;
  whatsapp_number: string | null;
  address: string | null;
};

type BusinessProfilePayload = {
  company_name: string | null;
  description: string | null;
  contact_phone: string | null;
  whatsapp_number: string | null;
  address: string | null;
};

const isMissingBusinessProfilesTableError = (error: { message?: string; code?: string } | null) => {
  if (!error) return false;

  return error.code === "PGRST205" || error.message?.includes("business_profiles") || false;
};

const getMetadataBusinessProfile = (metadata: unknown): BusinessProfilePayload | null => {
  if (!metadata || typeof metadata !== "object") return null;

  const meta = metadata as Record<string, unknown>;

  // Helper that searches multiple sources for a field value
  const readFrom = (sources: Record<string, unknown>[], ...keys: string[]): string | null => {
    for (const source of sources) {
      for (const key of keys) {
        const value = source[key];
        if (typeof value === "string" && value.trim().length > 0) return value;
      }
    }
    return null;
  };

  // Nested under business_profile (mobile primary fallback key)
  const nested =
    meta.business_profile && typeof meta.business_profile === "object"
      ? (meta.business_profile as Record<string, unknown>)
      : null;

  // Sources: nested object first, then flat user_metadata
  const sources: Record<string, unknown>[] = nested ? [nested, meta] : [meta];

  const result: BusinessProfilePayload = {
    company_name: readFrom(sources, "company_name", "companyName", "name"),
    description: readFrom(sources, "description", "about"),
    contact_phone: readFrom(sources, "contact_phone", "contactPhone", "phone", "contact"),
    whatsapp_number: readFrom(sources, "whatsapp_number", "whatsAppNumber", "whatsappNumber", "whatsapp"),
    address: readFrom(sources, "address", "location"),
  };

  // Return null only if absolutely nothing was found
  const hasAnyValue = Object.values(result).some((v) => v !== null);
  return hasAnyValue ? result : null;
};

const BusinessProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);

  const [companyName, setCompanyName] = useState("");
  const [description, setDescription] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [whatsAppNumber, setWhatsAppNumber] = useState("");
  const [address, setAddress] = useState("");

  const applyProfileToForm = (profile: BusinessProfileRow | null) => {
    setProfileId(profile?.id ?? null);
    setCompanyName(profile?.company_name ?? "");
    setDescription(profile?.description ?? "");
    setContactPhone(profile?.contact_phone ?? "");
    setWhatsAppNumber(profile?.whatsapp_number ?? "");
    setAddress(profile?.address ?? "");
  };

  const buildProfilePayload = (): BusinessProfilePayload => {
    const normalizeField = (value: string) => {
      const trimmedValue = value.trim();
      return trimmedValue.length > 0 ? trimmedValue : null;
    };

    return {
      company_name: normalizeField(companyName),
      description: normalizeField(description),
      contact_phone: normalizeField(contactPhone),
      whatsapp_number: normalizeField(whatsAppNumber),
      address: normalizeField(address),
    };
  };

  const loadLatestMetadataProfile = async () => {
    const { data, error } = await supabase.auth.getUser();

    const meta = error
      ? user?.user_metadata
      : (data.user?.user_metadata ?? user?.user_metadata);

    return getMetadataBusinessProfile(meta);
  };

  useEffect(() => {
    const loadBusinessProfile = async () => {
      if (!user) {
        applyProfileToForm(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      const { data, error } = await supabase
        .from("business_profiles")
        .select("id, company_name, description, contact_phone, whatsapp_number, address")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        if (isMissingBusinessProfilesTableError(error)) {
          applyProfileToForm(await loadLatestMetadataProfile());
        } else {
          toast({
            title: "Unable to load profile",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        applyProfileToForm(data ?? null);
      }

      setLoading(false);
    };

    if (!authLoading) loadBusinessProfile();
  }, [authLoading, user]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);

    const payload = buildProfilePayload();
    const { data: existingProfile, error: lookupError } = await supabase
      .from("business_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (lookupError) {
      if (isMissingBusinessProfilesTableError(lookupError)) {
        const { data: authData, error: authError } = await supabase.auth.updateUser({
          data: {
            ...user.user_metadata,
            business_profile: payload,
          },
        });

        setSaving(false);

        if (authError) {
          toast({
            title: "Unable to save",
            description: authError.message,
            variant: "destructive",
          });
          return;
        }

        applyProfileToForm(getMetadataBusinessProfile(authData.user?.user_metadata) ?? payload);
        toast({
          title: "Saved",
          description: "Business profile updated successfully.",
        });
        return;
      }

      setSaving(false);
      toast({
        title: "Unable to save",
        description: lookupError.message,
        variant: "destructive",
      });
      return;
    }

    const saveQuery = existingProfile?.id
      ? supabase
          .from("business_profiles")
          .update(payload)
          .eq("id", existingProfile.id)
          .eq("user_id", user.id)
      : supabase.from("business_profiles").insert({
          user_id: user.id,
          ...payload,
        });

    const { error } = await saveQuery;

    setSaving(false);

    if (error) {
      toast({
        title: "Unable to save",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    if (existingProfile?.id !== profileId) {
      setProfileId(existingProfile?.id ?? profileId);
    }

    const { data: refreshedProfile, error: refreshError } = await supabase
      .from("business_profiles")
      .select("id, company_name, description, contact_phone, whatsapp_number, address")
      .eq("user_id", user.id)
      .maybeSingle();

    if (refreshError) {
      if (isMissingBusinessProfilesTableError(refreshError)) {
        applyProfileToForm(payload);
      } else {
        toast({
          title: "Saved with sync warning",
          description: refreshError.message,
          variant: "destructive",
        });
      }
    } else {
      applyProfileToForm(refreshedProfile ?? null);
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
