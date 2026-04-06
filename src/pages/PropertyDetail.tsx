import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { properties, listingTypeLabels, propertyTypeLabels } from "@/lib/mockData";
import { Bed, Bath, Maximize, MapPin, Phone, Mail, ArrowLeft, MessageSquare, Check, School, Hospital, ShoppingBag, TreePine, Play } from "lucide-react";
import ContactModal from "@/components/ContactModal";
import { useState, useMemo, useEffect } from "react";
import { useDbProperties } from "@/hooks/useDbProperties";
import { supabase } from "@/integrations/supabase/client";

type PropertyOwnerDetails = {
  userId: string;
  fullName: string | null;
  phone: string | null;
  companyName: string | null;
  email: string | null;
  avatarUrl: string | null;
};

const PropertyDetail = () => {
  const { id } = useParams();
  const { dbProperties } = useDbProperties();
  const allProperties = useMemo(() => [...dbProperties, ...properties], [dbProperties]);
  const property = allProperties.find((p) => p.id === id);
  const [contactOpen, setContactOpen] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [ownerDetails, setOwnerDetails] = useState<PropertyOwnerDetails | null>(null);

  useEffect(() => {
    if (!property?.id) {
      setOwnerDetails(null);
      return;
    }

    let ignore = false;
    setOwnerDetails(null);

    const loadOwnerDetails = async () => {
      const { data, error } = await supabase.rpc("get_property_owner_details", {
        p_property_id: property.id,
      });

      if (ignore) return;

      if (error) {
        setOwnerDetails(null);
        return;
      }

      const ownerData = data?.[0] ?? null;
      if (!ownerData?.owner_user_id) {
        setOwnerDetails(null);
        return;
      }

      setOwnerDetails({
        userId: ownerData.owner_user_id,
        fullName: ownerData.owner_name ?? ownerData.owner_company_name ?? null,
        phone: ownerData.owner_phone ?? null,
        companyName: ownerData.owner_company_name ?? null,
        email: ownerData.owner_email ?? null,
        avatarUrl: ownerData.owner_avatar_url ?? null,
      });
    };

    void loadOwnerDetails();

    return () => {
      ignore = true;
    };
  }, [property?.id]);

  if (!property) {
    return (
      <main className="container py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-foreground mb-4">Property Not Found</h1>
        <Link to="/properties"><Button variant="outline">Back to Listings</Button></Link>
      </main>
    );
  }

  const listedByName = ownerDetails?.fullName || property.agent.name || "Property Owner";
  const listedByCompany = ownerDetails?.companyName || property.agent.company || "";
  const listedByPhone = ownerDetails?.phone || property.agent.phone || "";
  const listedByEmail = ownerDetails?.email || property.agent.email || "";
  const listedByAvatar = ownerDetails?.avatarUrl || property.agent.avatar || "/placeholder.svg";
  const listedByProfilePath = ownerDetails?.userId ? `/profile/${ownerDetails.userId}` : property.userId ? `/profile/${property.userId}` : null;
  const listedByCard = (
    <>
      <img src={listedByAvatar} alt={listedByName} className="h-12 w-12 rounded-full object-cover" />
      <div>
        <p className="font-semibold text-foreground">{listedByName}</p>
        {listedByCompany && <p className="text-sm text-muted-foreground">{listedByCompany}</p>}
      </div>
    </>
  );

  return (
    <main className="container py-8">
      <Link to="/properties" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to listings
      </Link>

      <div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center">
        <p className="text-sm font-semibold text-destructive">
          ⚠️ BEWARE OF FRAUD! DO NOT MAKE ANY PAYMENT UNTIL YOU HAVE PHYSICALLY INSPECTED THE PROPERTY!
        </p>
      </div>

      {/* Image Gallery */}
      <div className="grid gap-3 mb-8 lg:grid-cols-[2fr_1fr]">
        <div className="aspect-[16/10] overflow-hidden rounded-xl">
          <img
            src={property.images[activeImage]}
            alt={property.title}
            className="h-full w-full object-cover"
            onError={(e) => {
              const target = e.currentTarget;
              if (target.src.endsWith("/placeholder.svg")) return;
              target.src = "/placeholder.svg";
            }}
          />
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-1 lg:grid-rows-2">
          {property.images.slice(0, 2).map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveImage(i === activeImage ? 0 : i)}
              className={`aspect-[16/10] lg:aspect-auto overflow-hidden rounded-xl border-2 transition-all ${i === activeImage ? "border-primary" : "border-transparent hover:border-border"}`}
            >
              <img
                src={img}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.src.endsWith("/placeholder.svg")) return;
                  target.src = "/placeholder.svg";
                }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Videos */}
      {property.videos && property.videos.length > 0 && (
        <div className="mb-8">
          <h2 className="font-display text-xl font-semibold text-foreground mb-3">Property Videos</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {property.videos.map((vid, i) => (
              <div key={i} className="aspect-video rounded-xl overflow-hidden border border-border bg-card">
                <video
                  src={vid}
                  controls
                  playsInline
                  preload="metadata"
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Details */}
        <div>
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge variant="default">{listingTypeLabels[property.listingType]}</Badge>
            <Badge variant="secondary">{propertyTypeLabels[property.propertyType]}</Badge>
            {property.status && property.status !== "available" && (
              <Badge variant={property.status === "sold" ? "destructive" : "outline"}>
                {property.status === "sold" ? "Sold" : "Reserved"}
              </Badge>
            )}
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-1">{property.title}</h1>
          <p className="flex items-center gap-1 text-muted-foreground mb-4">
            <MapPin className="h-4 w-4" /> {property.address}
          </p>
          <p className="font-display text-3xl font-bold text-primary mb-6">{property.priceLabel}</p>

          {property.propertyType !== "land" && (
            <div className="flex gap-6 mb-8 rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2"><Bed className="h-5 w-5 text-primary" /><div><p className="text-sm text-muted-foreground">Bedrooms</p><p className="font-semibold text-foreground">{property.bedrooms}</p></div></div>
              <div className="flex items-center gap-2"><Bath className="h-5 w-5 text-primary" /><div><p className="text-sm text-muted-foreground">Bathrooms</p><p className="font-semibold text-foreground">{property.bathrooms}</p></div></div>
              <div className="flex items-center gap-2"><Maximize className="h-5 w-5 text-primary" /><div><p className="text-sm text-muted-foreground">Area</p><p className="font-semibold text-foreground">{property.area.toLocaleString()} sqft</p></div></div>
            </div>
          )}

          <div className="mb-8">
            <h2 className="font-display text-xl font-semibold text-foreground mb-3">Description</h2>
            <p className="text-muted-foreground leading-relaxed">{property.description}</p>
          </div>

          <div>
            <h2 className="font-display text-xl font-semibold text-foreground mb-3">Features</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {property.features.map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-primary" /> {f}
                </div>
              ))}
            </div>
          </div>

          {/* Map */}
          <div className="mt-8">
            <h2 className="font-display text-xl font-semibold text-foreground mb-3">Location on Map</h2>
            <div className="rounded-xl overflow-hidden border border-border aspect-[16/9]">
              <iframe
                title="Property Location"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(property.address)}`}
              />
            </div>
          </div>

          {/* Nearby Places */}
          {property.nearbyPlaces && property.nearbyPlaces.length > 0 && (
            <div className="mt-8">
              <h2 className="font-display text-xl font-semibold text-foreground mb-3">Nearby Locations</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {property.nearbyPlaces.map((place) => {
                  const Icon = place.type === "School" ? School : place.type === "Hospital" ? Hospital : place.type === "Shopping" ? ShoppingBag : TreePine;
                  return (
                    <div key={place.name} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{place.name}</p>
                        <p className="text-xs text-muted-foreground">{place.type} · {place.distance}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Agent Sidebar */}
        <div className="lg:sticky lg:top-24 h-fit">
          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <h3 className="font-display text-lg font-semibold text-foreground mb-4">Listed by</h3>
            {listedByProfilePath ? (
              <Link
                to={listedByProfilePath}
                className="flex items-center gap-3 mb-4 rounded-lg p-2 -mx-2 transition-colors hover:bg-accent"
              >
                {listedByCard}
              </Link>
            ) : (
              <div className="flex items-center gap-3 mb-4 rounded-lg p-2 -mx-2">
                {listedByCard}
              </div>
            )}
            {(listedByPhone || listedByEmail) && (
              <div className="space-y-2 text-sm text-muted-foreground mb-6">
                {listedByPhone && <p className="flex items-center gap-2"><Phone className="h-4 w-4" /> {listedByPhone}</p>}
                {listedByEmail && <p className="flex items-center gap-2"><Mail className="h-4 w-4" /> {listedByEmail}</p>}
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => setCallOpen(true)}
              className="mb-3 w-full gap-2"
              disabled={!listedByPhone}
            >
              <Phone className="h-4 w-4" /> Call Owner
            </Button>
            <Button
              onClick={() => setContactOpen(true)}
              className="w-full gradient-warm border-0 text-primary-foreground gap-2"
            >
              <MessageSquare className="h-4 w-4" /> Send Message
            </Button>
          </div>
        </div>
      </div>

      <ContactModal open={contactOpen} onOpenChange={setContactOpen} property={property} />

      <AlertDialog open={callOpen} onOpenChange={setCallOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Call Property Owner</AlertDialogTitle>
            <AlertDialogDescription>
              Use the number below to contact {listedByName}{listedByCompany ? ` at ${listedByCompany}` : ""}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="rounded-md border border-border bg-muted/40 p-4">
            <p className="text-sm text-muted-foreground">Phone number</p>
            <p className="mt-1 text-lg font-semibold text-foreground">{listedByPhone || "Phone number not available"}</p>
            {listedByEmail && <p className="mt-2 text-sm text-muted-foreground">{listedByEmail}</p>}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (listedByPhone) {
                  window.location.href = `tel:${listedByPhone}`;
                }
              }}
              disabled={!listedByPhone}
            >
              Call Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
};

export default PropertyDetail;
