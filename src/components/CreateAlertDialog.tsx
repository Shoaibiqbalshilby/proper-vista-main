import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { propertyTypeLabels, listingTypeLabels, PropertyType, ListingType } from "@/lib/mockData";
import { usePropertyAlerts } from "@/hooks/usePropertyAlerts";
import { useAuth } from "@/contexts/AuthContext";
import { BellPlus } from "lucide-react";

interface CreateAlertDialogProps {
  defaultLocation?: string;
  defaultListingType?: string;
  defaultPropertyType?: string;
  defaultMinBeds?: string;
  defaultMinBaths?: string;
  defaultMinPrice?: string;
  defaultMaxPrice?: string;
}

const CreateAlertDialog = ({
  defaultLocation = "",
  defaultListingType = "all",
  defaultPropertyType = "all",
  defaultMinBeds = "any",
  defaultMinBaths = "any",
  defaultMinPrice = "",
  defaultMaxPrice = "",
}: CreateAlertDialogProps) => {
  const { user } = useAuth();
  const { createAlert } = usePropertyAlerts();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("My Alert");
  const [location, setLocation] = useState(defaultLocation);
  const [listingType, setListingType] = useState(defaultListingType);
  const [propertyType, setPropertyType] = useState(defaultPropertyType);
  const [minBeds, setMinBeds] = useState(defaultMinBeds);
  const [minBaths, setMinBaths] = useState(defaultMinBaths);
  const [minPrice, setMinPrice] = useState(defaultMinPrice);
  const [maxPrice, setMaxPrice] = useState(defaultMaxPrice);

  const handleCreate = async () => {
    await createAlert({
      name,
      location: location || null,
      listing_type: listingType === "all" ? null : listingType,
      property_type: propertyType === "all" ? null : propertyType,
      min_bedrooms: minBeds !== "any" ? Number(minBeds) : null,
      min_bathrooms: minBaths !== "any" ? Number(minBaths) : null,
      min_price: minPrice ? Number(minPrice) : null,
      max_price: maxPrice ? Number(maxPrice) : null,
    });
    setOpen(false);
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <BellPlus className="h-4 w-4" /> Create Alert
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Create Property Alert</DialogTitle>
          <DialogDescription>Get notified when a new property matches your criteria.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Alert Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Lagos 3-bed houses" />
          </div>
          <div className="space-y-2">
            <Label>Location</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Lagos, Lekki..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Listing Type</Label>
              <Select value={listingType} onValueChange={setListingType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any</SelectItem>
                  {(Object.entries(listingTypeLabels) as [ListingType, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Property Type</Label>
              <Select value={propertyType} onValueChange={setPropertyType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any</SelectItem>
                  {(Object.entries(propertyTypeLabels) as [PropertyType, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
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
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Min Price (₦)</Label>
              <Input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="e.g. 10000000" />
            </div>
            <div className="space-y-2">
              <Label>Max Price (₦)</Label>
              <Input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="e.g. 500000000" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleCreate} className="gradient-warm border-0 text-primary-foreground">
            Create Alert
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAlertDialog;
