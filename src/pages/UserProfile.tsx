import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, MapPin, Calendar, Bed, Bath, Maximize, Phone, Mail, Pencil, Edit } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { propertyTypeLabels, listingTypeLabels } from "@/lib/mockData";
import { useToast } from "@/hooks/use-toast";
import { normalizeMediaUrls } from "@/lib/media";

const statusLabels: Record<string, string> = {
  available: "Available",
  reserved: "Reserved",
  sold: "Sold",
};

const statusBadgeVariant = (status: string) => {
  if (status === "reserved") return "outline" as const;
  if (status === "sold") return "destructive" as const;
  return "default" as const;
};

interface Profile {
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
  user_id: string;
}

interface DbProperty {
  id: string;
  title: string;
  price_label: string;
  property_type: string;
  listing_type: string;
  location: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  images: string[];
  created_at: string;
  status: string;
}

  const UserProfile = () => {
  const { userId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [properties, setProperties] = useState<DbProperty[]>([]);
  const [loading, setLoading] = useState(true);

  const isOwnProfile = user?.id === userId;

  useEffect(() => {
    if (!userId) return;
    const fetchData = async () => {
      const [profileRes, propertiesRes] = await Promise.all([
        supabase.from("profiles").select("full_name, avatar_url, phone, created_at, user_id").eq("user_id", userId).single(),
        supabase.from("properties").select("id, title, price_label, property_type, listing_type, location, bedrooms, bathrooms, area, images, created_at, status").eq("user_id", userId).order("created_at", { ascending: false }),
      ]);
      if (profileRes.data) setProfile(profileRes.data);
      if (propertiesRes.data) {
        setProperties(
          propertiesRes.data.map((property) => ({
            ...property,
            images: normalizeMediaUrls(property.images),
          }))
        );
      }
      setLoading(false);
    };
    fetchData();
  }, [userId]);

  const handleStatusChange = async (propId: string, newStatus: string) => {
    const { error } = await supabase.from("properties").update({ status: newStatus } as any).eq("id", propId);
    if (error) {
      toast({ title: "Error", description: "Failed to update status.", variant: "destructive" });
      return;
    }
    setProperties((prev) => prev.map((p) => (p.id === propId ? { ...p, status: newStatus } : p)));
    toast({ title: "Status Updated", description: `Property marked as ${statusLabels[newStatus]}.` });
  };


  if (!profile) {
    return (
      <main className="container py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-foreground mb-4">Profile Not Found</h1>
        <Link to="/"><Button variant="outline">Go Home</Button></Link>
      </main>
    );
  }

  const initials = profile.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <main className="container py-8">
      {/* Profile Header */}
      <div className="rounded-xl border border-border bg-card p-6 mb-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <Avatar className="h-20 w-20">
            <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name || "User"} />
            <AvatarFallback className="text-xl font-display bg-primary/10 text-primary">{initials}</AvatarFallback>
          </Avatar>
          <div className="text-center sm:text-left flex-1">
            <h1 className="font-display text-2xl font-bold text-foreground">{profile.full_name || "User"}</h1>
            <p className="text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-1 mt-1">
              <Calendar className="h-3.5 w-3.5" />
              Member since {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}
            </p>
            {isOwnProfile && profile.phone && (
              <p className="text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-1 mt-1">
                <Phone className="h-3.5 w-3.5" /> {profile.phone}
              </p>
            )}
            <div className="mt-3">
              <Badge variant="secondary">{properties.length} {properties.length === 1 ? "listing" : "listings"}</Badge>
            </div>
          </div>
          {isOwnProfile && (
            <Link to="/list-property">
              <Button className="gradient-warm border-0 text-primary-foreground gap-1.5">
                <Pencil className="h-4 w-4" /> New Listing
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Properties */}
      <h2 className="font-display text-xl font-semibold text-foreground mb-4">
        {isOwnProfile ? "Your Listings" : `Listings by ${profile.full_name || "User"}`}
      </h2>

      {properties.length === 0 ? (
        <div className="text-center py-16 rounded-lg border border-border bg-card">
          <User className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
          <p className="text-muted-foreground">
            {isOwnProfile ? "You haven't listed any properties yet." : "No properties listed yet."}
          </p>
          {isOwnProfile && (
            <Link to="/list-property">
              <Button variant="outline" className="mt-4">List Your First Property</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((prop) => (
            <Link key={prop.id} to={`/property/db-${prop.id}`} className="block">
              <div className="rounded-xl border border-border bg-card overflow-hidden shadow-card hover:shadow-lg transition-shadow">
                <div className="aspect-[16/10] bg-muted">
                  {prop.images.length > 0 ? (
                    <img
                      src={prop.images[0]}
                      alt={prop.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (target.src.endsWith("/placeholder.svg")) return;
                        target.src = "/placeholder.svg";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">No image</div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex flex-wrap gap-2 mb-2">
                    <Badge variant="default">{listingTypeLabels[prop.listing_type as keyof typeof listingTypeLabels] || prop.listing_type}</Badge>
                    <Badge variant="secondary">{propertyTypeLabels[prop.property_type as keyof typeof propertyTypeLabels] || prop.property_type}</Badge>
                    <Badge variant={statusBadgeVariant(prop.status || "available")}>{statusLabels[prop.status || "available"] || "Available"}</Badge>
                  </div>
                  <h3 className="font-display font-semibold text-foreground line-clamp-1">{prop.title}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="h-3.5 w-3.5" /> {prop.location}
                  </p>
                  <p className="font-display font-bold text-primary mt-2">{prop.price_label}</p>
                  {prop.property_type !== "land" && (
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Bed className="h-3.5 w-3.5" /> {prop.bedrooms}</span>
                      <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" /> {prop.bathrooms}</span>
                      <span className="flex items-center gap-1"><Maximize className="h-3.5 w-3.5" /> {prop.area.toLocaleString()} sqft</span>
                    </div>
                  )}
                  {isOwnProfile && (
                    <div className="mt-3 flex items-center gap-3" onClick={(e) => e.preventDefault()}>
                      <Select value={prop.status || "available"} onValueChange={(val) => handleStatusChange(prop.id, val)}>
                        <SelectTrigger className="h-8 text-xs w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">Available</SelectItem>
                          <SelectItem value="reserved">Reserved</SelectItem>
                          <SelectItem value="sold">Sold</SelectItem>
                        </SelectContent>
                      </Select>
                      <Link
                        to={`/edit-property/${prop.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                      >
                        <Edit className="h-3.5 w-3.5" /> Edit
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
};

export default UserProfile;
