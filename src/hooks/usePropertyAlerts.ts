import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface PropertyAlert {
  id: string;
  name: string;
  location: string | null;
  listing_type: string | null;
  property_type: string | null;
  min_bedrooms: number | null;
  min_bathrooms: number | null;
  min_price: number | null;
  max_price: number | null;
  is_active: boolean;
  created_at: string;
}

export function usePropertyAlerts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<PropertyAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    if (!user) { setAlerts([]); setLoading(false); return; }
    const { data, error } = await supabase
      .from("property_alerts")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setAlerts(data as PropertyAlert[]);
    setLoading(false);
  };

  useEffect(() => { fetchAlerts(); }, [user]);

  const createAlert = async (alert: Omit<PropertyAlert, "id" | "created_at" | "is_active">) => {
    if (!user) return;
    const { error } = await supabase.from("property_alerts").insert({
      ...alert,
      user_id: user.id,
    } as any);
    if (error) {
      toast({ title: "Error", description: "Failed to create alert.", variant: "destructive" });
      return;
    }
    toast({ title: "Alert Created", description: "You'll be notified when matching properties are listed." });
    fetchAlerts();
  };

  const deleteAlert = async (id: string) => {
    const { error } = await supabase.from("property_alerts").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete alert.", variant: "destructive" });
      return;
    }
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    toast({ title: "Alert Deleted" });
  };

  const toggleAlert = async (id: string, isActive: boolean) => {
    const { error } = await supabase.from("property_alerts").update({ is_active: isActive } as any).eq("id", id);
    if (!error) setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, is_active: isActive } : a));
  };

  return { alerts, loading, createAlert, deleteAlert, toggleAlert, refetch: fetchAlerts };
}
