import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Bed, Bath, Heart, Maximize, MapPin } from "lucide-react";
import { Property, listingTypeLabels } from "@/lib/mockData";

interface PropertyCardProps {
  property: Property;
  isSaved?: boolean;
  onToggleSave?: (propertyId: string) => void;
  showSaveButton?: boolean;
}

const listingBadgeVariant = (type: string) => {
  if (type === "sale") return "default";
  if (type === "rent") return "secondary";
  return "outline";
};

const PropertyCard = ({ property, isSaved = false, onToggleSave, showSaveButton = false }: PropertyCardProps) => (
  <Link to={`/property/${property.id}`} className="group block">
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={property.images[0]}
          alt={property.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            const target = e.currentTarget;
            if (target.src.endsWith("/placeholder.svg")) return;
            target.src = "/placeholder.svg";
          }}
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge variant={listingBadgeVariant(property.listingType)}>
            {listingTypeLabels[property.listingType]}
          </Badge>
          {property.isFeatured && (
            <Badge className="gradient-warm border-0 text-primary-foreground">Featured</Badge>
          )}
        </div>
        {showSaveButton && onToggleSave && (
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute right-3 top-3 h-8 w-8 rounded-full bg-card/95"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleSave(property.id);
            }}
          >
            <Heart className={`h-4 w-4 ${isSaved ? "fill-current text-primary" : "text-muted-foreground"}`} />
          </Button>
        )}
      </div>
      <div className="p-4">
        <p className="font-display text-xl font-bold text-primary">{property.priceLabel}</p>
        <h3 className="mt-1 font-display text-lg font-semibold text-foreground line-clamp-1">
          {property.title}
        </h3>
        <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          <span className="line-clamp-1">{property.location}</span>
        </div>
        {property.propertyType !== "land" && (
          <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Bed className="h-4 w-4" />{property.bedrooms} Beds</span>
            <span className="flex items-center gap-1"><Bath className="h-4 w-4" />{property.bathrooms} Baths</span>
            <span className="flex items-center gap-1"><Maximize className="h-4 w-4" />{property.area.toLocaleString()} sqft</span>
          </div>
        )}
        {property.propertyType === "land" && (
          <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Maximize className="h-4 w-4" />{(property.area / 43560).toFixed(1)} acres</span>
          </div>
        )}
        {/* Lister Info */}
        <div className="mt-3 border-t border-border pt-3">
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7">
              <AvatarImage src={property.agent.avatar} alt={property.agent.name} />
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {property.agent.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{property.agent.name}</p>
              <p className="text-[11px] text-muted-foreground truncate">{property.agent.company}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Link>
);

export default PropertyCard;
