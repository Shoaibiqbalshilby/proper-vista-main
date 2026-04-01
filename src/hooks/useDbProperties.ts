import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Property } from "@/lib/mockData";
import { normalizeMediaUrls } from "@/lib/media";

export function useDbProperties() {
  const [dbProperties, setDbProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      const { data: propData, error } = await supabase
        .from("properties")
        .select("*")
        .order("created_at", { ascending: false });

      if (error || !propData) {
        setLoading(false);
        return;
      }

      // Fetch profiles for all unique user_ids
      const userIds = [...new Set(propData.map((p) => p.user_id).filter(Boolean))];
      const { data: profilesData } = userIds.length
        ? await supabase
            .from("profiles")
            .select("user_id, full_name, avatar_url")
            .in("user_id", userIds)
        : { data: [] as { user_id: string; full_name: string | null; avatar_url: string | null }[] };

      const profileMap = new Map(
        (profilesData || []).map((p) => [p.user_id, p])
      );

      setDbProperties(
        propData.map((row) => {
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
          const profile = profileMap.get(row.user_id);
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
            videos: normalizeMediaUrls((row as any).videos),
            features: row.features || [],
            nearbyPlaces: [],
            agent: {
              name: profile?.full_name || "Property Owner",
              company: "",
              phone: "",
              email: "",
              avatar: profile?.avatar_url || "/placeholder.svg",
            },
            createdAt: row.created_at || new Date().toISOString(),
            isFeatured: Boolean(row.is_featured),
            status: (row as any).status || "available",
          };
        })
      );
      setLoading(false);
    };

    fetchProperties();
  }, []);

  return { dbProperties, loading };
}
