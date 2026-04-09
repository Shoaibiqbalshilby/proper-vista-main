import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { Property } from "@/lib/mockData";
import { normalizeMediaUrls } from "@/lib/media";

type PropertyRow = Database["public"]["Tables"]["properties"]["Row"];

type PropertyOwnerLookup = {
  owner_user_id: string | null;
  owner_name: string | null;
  owner_phone: string | null;
  owner_company_name: string | null;
  owner_email: string | null;
  owner_avatar_url: string | null;
};

export function useDbProperties() {
  const [dbProperties, setDbProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProperties = useCallback(async () => {
    setLoading(true);

    const { data: propData, error } = await supabase
      .from("properties")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !propData) {
      setDbProperties([]);
      setLoading(false);
      return;
    }

    const ownerEntries = await Promise.all(
      propData.map(async (row) => {
        const { data } = await supabase.rpc("get_property_owner_details", {
          p_property_id: row.id,
        });

        return [row.id, (data?.[0] ?? null) as PropertyOwnerLookup | null] as const;
      })
    );

    const ownerMap = new Map(ownerEntries);

    setDbProperties(
      propData.map((row: PropertyRow) => {
        const price = Number(row.price ?? 0);
        const location = row.location || "Unknown location";
        const address = row.address || location;
        const listingType = row.listing_type === "rent" || row.listing_type === "short-let" ? row.listing_type : "sale";
        const propertyType =
          row.property_type === "apartment" ||
          row.property_type === "villa" ||
          row.property_type === "land" ||
          row.property_type === "condo"
            ? row.property_type
            : "house";
        const owner = ownerMap.get(row.id);
        const ownerName = owner?.owner_name || owner?.owner_company_name || "Property Owner";
        const ownerPhone = owner?.owner_phone || "";
        const ownerCompany = owner?.owner_company_name || "";
        const ownerEmail = owner?.owner_email || "";
        const ownerAvatar = owner?.owner_avatar_url || "/placeholder.svg";

        return {
          id: row.id,
          userId: row.user_id,
          title: row.title || "Untitled Property",
          description: row.description || "",
          price,
          priceLabel: row.price_label || (price > 0 ? `₦${price.toLocaleString()}` : "Price on request"),
          propertyType: propertyType as Property["propertyType"],
          listingType: listingType as Property["listingType"],
          location,
          address,
          bedrooms: Number(row.bedrooms ?? 0),
          bathrooms: Number(row.bathrooms ?? 0),
          area: Number(row.area ?? 0),
          images: normalizeMediaUrls(row.images),
          videos: normalizeMediaUrls(row.videos),
          features: row.features || [],
          nearbyPlaces: [],
          agent: {
            name: ownerName,
            company: ownerCompany,
            phone: ownerPhone,
            email: ownerEmail,
            avatar: ownerAvatar,
          },
          createdAt: row.created_at || new Date().toISOString(),
          isFeatured: Boolean(row.is_featured),
          status: row.status || "available",
        };
      })
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchProperties();
  }, [fetchProperties]);

  useEffect(() => {
    const channel = supabase
      .channel(`db-properties-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "properties",
        },
        () => {
          void fetchProperties();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchProperties]);

  return { dbProperties, loading, refreshProperties: fetchProperties };
}
