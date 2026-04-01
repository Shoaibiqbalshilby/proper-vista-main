import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export function useSavedProperties() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [savedPropertyIds, setSavedPropertyIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSavedProperties = useCallback(async () => {
    if (!user) {
      setSavedPropertyIds([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("saved_properties")
      .select("property_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setSavedPropertyIds([]);
      setLoading(false);
      return;
    }

    setSavedPropertyIds((data ?? []).map((row) => row.property_id));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    setLoading(true);
    loadSavedProperties();
  }, [loadSavedProperties]);

  const savedSet = useMemo(() => new Set(savedPropertyIds), [savedPropertyIds]);

  const isSaved = useCallback((propertyId: string) => savedSet.has(propertyId), [savedSet]);

  const toggleSaved = useCallback(
    async (propertyId: string) => {
      if (!user) {
        toast({
          title: "Sign in required",
          description: "Please sign in to save properties.",
        });
        return false;
      }

      const currentlySaved = savedSet.has(propertyId);

      if (currentlySaved) {
        const { error } = await supabase
          .from("saved_properties")
          .delete()
          .eq("user_id", user.id)
          .eq("property_id", propertyId);

        if (error) {
          toast({
            title: "Unable to remove",
            description: "Could not remove property from saved list.",
            variant: "destructive",
          });
          return false;
        }

        setSavedPropertyIds((prev) => prev.filter((id) => id !== propertyId));
        return true;
      }

      const { error } = await supabase.from("saved_properties").insert({
        user_id: user.id,
        property_id: propertyId,
      });

      if (error) {
        toast({
          title: "Unable to save",
          description: "Could not save property right now.",
          variant: "destructive",
        });
        return false;
      }

      setSavedPropertyIds((prev) => [propertyId, ...prev]);
      return true;
    },
    [savedSet, toast, user]
  );

  return {
    savedPropertyIds,
    loading,
    isSaved,
    toggleSaved,
    refreshSaved: loadSavedProperties,
  };
}
