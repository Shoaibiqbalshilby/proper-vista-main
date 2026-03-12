import { useMemo, useRef, useState } from "react";
import { subDays } from "date-fns";
import { useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import PropertyCard from "@/components/PropertyCard";
import { properties, propertyTypeLabels, listingTypeLabels, PropertyType, ListingType, nigerianLocations } from "@/lib/mockData";
import { useDbProperties } from "@/hooks/useDbProperties";
import { Search, SlidersHorizontal, X, MapPin } from "lucide-react";
import CreateAlertDialog from "@/components/CreateAlertDialog";
import { useAuth } from "@/contexts/AuthContext";

const Properties = () => {
  const [searchParams] = useSearchParams();
  const [location, setLocation] = useState(searchParams.get("location") || "");
  const [locationQuery, setLocationQuery] = useState(searchParams.get("location") || "");
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const locationRef = useRef<HTMLDivElement>(null);
  const [listingType, setListingType] = useState<string>(searchParams.get("listing") || "all");
  const [propertyType, setPropertyType] = useState<string>(searchParams.get("type") || "all");
  const [minBeds, setMinBeds] = useState("any");
  const [minBaths, setMinBaths] = useState("any");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [newlyListed, setNewlyListed] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const { dbProperties } = useDbProperties();
  const { user } = useAuth();

  const allProperties = useMemo(() => [...dbProperties, ...properties], [dbProperties]);

  const filtered = useMemo(() => {
    const sevenDaysAgo = subDays(new Date(), 7);
    return allProperties.filter((p) => {
      const safeLocation = (p.location || "").toLowerCase();
      const safeAddress = (p.address || "").toLowerCase();
      const searchText = location.toLowerCase();

      if (location && !safeLocation.includes(searchText) && !safeAddress.includes(searchText)) return false;
      if (listingType !== "all" && p.listingType !== listingType) return false;
      if (propertyType !== "all" && p.propertyType !== propertyType) return false;
      if (minBeds !== "any" && p.bedrooms < Number(minBeds)) return false;
      if (minBaths !== "any" && p.bathrooms < Number(minBaths)) return false;
      if (minPrice && p.price < Number(minPrice)) return false;
      if (maxPrice && p.price > Number(maxPrice)) return false;
      if (newlyListed && new Date(p.createdAt) < sevenDaysAgo) return false;
      return true;
    });
  }, [allProperties, location, listingType, propertyType, minBeds, minBaths, minPrice, maxPrice, newlyListed]);

  const filteredLocations = useMemo(() => {
    if (!locationQuery) return nigerianLocations;
    return nigerianLocations.filter((loc) =>
      loc.toLowerCase().includes(locationQuery.toLowerCase())
    );
  }, [locationQuery]);

  const handleLocationSelect = (loc: string) => {
    setLocation(loc);
    setLocationQuery(loc);
    setShowLocationDropdown(false);
  };

  const clearFilters = () => {
    setLocation("");
    setLocationQuery("");
    setListingType("all");
    setPropertyType("all");
    setMinBeds("any");
    setMinBaths("any");
    setMinPrice("");
    setMaxPrice("");
    setNewlyListed(false);
  };

  return (
    <main className="container py-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">Browse Properties</h1>
        <p className="text-muted-foreground">Discover your perfect property from our curated listings.</p>
      </div>

      {/* Search & Filter Bar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1" ref={locationRef}>
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by city, town or state..."
            className="pl-9"
            value={locationQuery}
            onChange={(e) => {
              setLocationQuery(e.target.value);
              setLocation(e.target.value);
              setShowLocationDropdown(true);
            }}
            onFocus={() => setShowLocationDropdown(true)}
            onBlur={() => setTimeout(() => setShowLocationDropdown(false), 200)}
          />
          {showLocationDropdown && filteredLocations.length > 0 && (
            <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-popover text-popover-foreground shadow-md">
              {filteredLocations.slice(0, 20).map((loc) => (
                <button
                  key={loc}
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors text-left"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleLocationSelect(loc)}
                >
                  <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                  {loc}
                </button>
              ))}
            </div>
          )}
        </div>
        <Select value={listingType} onValueChange={setListingType}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Listing Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {(Object.entries(listingTypeLabels) as [ListingType, string][]).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={propertyType} onValueChange={setPropertyType}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Property Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Properties</SelectItem>
            {(Object.entries(propertyTypeLabels) as [PropertyType, string][]).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" className="gap-2" onClick={() => setShowFilters(!showFilters)}>
          <SlidersHorizontal className="h-4 w-4" /> Filters
        </Button>
        {user && (
          <CreateAlertDialog
            defaultLocation={location}
            defaultListingType={listingType}
            defaultPropertyType={propertyType}
            defaultMinBeds={minBeds}
            defaultMinBaths={minBaths}
            defaultMinPrice={minPrice}
            defaultMaxPrice={maxPrice}
          />
        )}
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="mb-6 rounded-lg border border-border bg-card p-4 shadow-card animate-fade-in">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Min Bedrooms</Label>
              <Select value={minBeds} onValueChange={setMinBeds}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  {[1, 2, 3, 4, 5].map((n) => <SelectItem key={n} value={String(n)}>{n}+</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Min Bathrooms</Label>
              <Select value={minBaths} onValueChange={setMinBaths}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  {[1, 2, 3, 4].map((n) => <SelectItem key={n} value={String(n)}>{n}+</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Min Price (₦)</Label>
              <Input
                type="number"
                placeholder="e.g. 10,000,000"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Price (₦)</Label>
              <Input
                type="number"
                placeholder="e.g. 500,000,000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Checkbox
              id="newly-listed"
              checked={newlyListed}
              onCheckedChange={(checked) => setNewlyListed(checked === true)}
            />
            <Label htmlFor="newly-listed" className="cursor-pointer">Newly listed (last 7 days)</Label>
          </div>
          <Button variant="ghost" size="sm" className="mt-3 gap-1 text-muted-foreground" onClick={clearFilters}>
            <X className="h-3 w-3" /> Clear all filters
          </Button>
        </div>
      )}

      {/* Results */}
      <p className="mb-4 text-sm text-muted-foreground">{filtered.length} {filtered.length === 1 ? "property" : "properties"} found</p>
      {filtered.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => <PropertyCard key={p.id} property={p} />)}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Search className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <h3 className="font-display text-xl font-semibold text-foreground mb-2">No properties found</h3>
          <p className="text-muted-foreground">Try adjusting your filters or search criteria.</p>
        </div>
      )}
    </main>
  );
};

export default Properties;
