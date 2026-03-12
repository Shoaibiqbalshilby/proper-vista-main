import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { propertyTypeLabels, listingTypeLabels } from "@/lib/mockData";
import { LogIn, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const EditProperty = () => {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [listingType, setListingType] = useState("");
  const [location, setLocation] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [area, setArea] = useState("");
  const [landUnit, setLandUnit] = useState("plots");
  const [landSize, setLandSize] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!propertyId || authLoading) return;
    const fetchProperty = async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("id", propertyId)
        .single();

      if (error || !data) {
        toast({ title: "Error", description: "Property not found.", variant: "destructive" });
        navigate("/properties");
        return;
      }

      if (data.user_id !== user?.id) {
        toast({ title: "Unauthorized", description: "You can only edit your own listings.", variant: "destructive" });
        navigate("/properties");
        return;
      }

      setTitle(data.title);
      setPrice(String(data.price));
      setPropertyType(data.property_type);
      setListingType(data.listing_type);
      setLocation(data.location);
      setBedrooms(String(data.bedrooms));
      setBathrooms(String(data.bathrooms));
      setArea(String(data.area));
      setDescription(data.description);

      // Parse land size from features if land type
      if (data.property_type === "land" && data.features?.length > 0) {
        const match = data.features[0]?.match(/^([\d.]+)\s+(\w+)$/);
        if (match) {
          setLandSize(match[1]);
          setLandUnit(match[2].toLowerCase());
        }
      }

      setLoading(false);
    };
    fetchProperty();
  }, [propertyId, user, authLoading]);

  const formatPriceLabel = (priceVal: number, lt: string) => {
    const formatted = `₦${priceVal.toLocaleString()}`;
    if (lt === "rent") return `${formatted}/mo`;
    if (lt === "short-let") return `${formatted}/night`;
    return formatted;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !propertyType || !listingType || !propertyId) return;

    setSubmitting(true);
    try {
      const priceNum = Number(price);
      let computedArea = Number(area) || 0;
      const landFeatures: string[] = [];
      if (propertyType === "land" && landSize) {
        const size = Number(landSize);
        landFeatures.push(`${size} ${landUnit}`);
        if (landUnit === "plots") computedArea = Math.round(size * 5382);
        else if (landUnit === "acres") computedArea = Math.round(size * 43560);
        else if (landUnit === "hectares") computedArea = Math.round(size * 107639);
      }

      const { error } = await supabase
        .from("properties")
        .update({
          title,
          description,
          price: priceNum,
          price_label: formatPriceLabel(priceNum, listingType),
          property_type: propertyType,
          listing_type: listingType,
          location,
          address: location,
          bedrooms: Number(bedrooms) || 0,
          bathrooms: Number(bathrooms) || 0,
          area: computedArea,
          features: landFeatures,
        })
        .eq("id", propertyId);

      if (error) throw error;

      toast({ title: "Property Updated!", description: "Your changes have been saved." });
      navigate(`/property/db-${propertyId}`);
    } catch (error: any) {
      console.error("Error updating property:", error);
      toast({ title: "Error", description: "Failed to update property. Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return <main className="container py-20 text-center"><p className="text-muted-foreground">Loading...</p></main>;
  }

  if (!user) {
    return (
      <main className="container py-20 text-center animate-fade-in">
        <div className="mx-auto max-w-md">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <LogIn className="h-7 w-7 text-muted-foreground" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-3">Sign In Required</h1>
          <p className="text-muted-foreground mb-6">You need to sign in to edit a property.</p>
          <Link to="/auth"><Button className="gradient-warm border-0 text-primary-foreground">Sign In</Button></Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container py-8">
      <div className="mx-auto max-w-2xl">
        <Link to={`/property/db-${propertyId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to property
        </Link>
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">Edit Property</h1>
        <p className="text-muted-foreground mb-8">Update your property listing details below.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Property Title *</Label>
              <Input id="title" placeholder="e.g. Modern 3-Bed Apartment" required maxLength={100} value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price (₦) *</Label>
              <Input id="price" type="number" placeholder="e.g. 250000000" required min={0} value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Property Type *</Label>
              <Select value={propertyType} onValueChange={setPropertyType} required>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(propertyTypeLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Listing Type *</Label>
              <Select value={listingType} onValueChange={setListingType} required>
                <SelectTrigger><SelectValue placeholder="Select listing type" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(listingTypeLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <Input id="location" placeholder="City, State or full address" required maxLength={200} value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>

          {propertyType === "land" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Unit *</Label>
                <Select value={landUnit} onValueChange={setLandUnit}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="plots">Plots</SelectItem>
                    <SelectItem value="acres">Acres</SelectItem>
                    <SelectItem value="hectares">Hectares</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="landSize">Number of {landUnit.charAt(0).toUpperCase() + landUnit.slice(1)} *</Label>
                <Input id="landSize" type="number" placeholder={`e.g. 5 ${landUnit}`} min={0.1} step="0.1" required value={landSize} onChange={(e) => setLandSize(e.target.value)} />
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="beds">Bedrooms</Label>
                <Input id="beds" type="number" placeholder="0" min={0} max={50} value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="baths">Bathrooms</Label>
                <Input id="baths" type="number" placeholder="0" min={0} max={50} value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="area">Area (sqft)</Label>
                <Input id="area" type="number" placeholder="0" min={0} value={area} onChange={(e) => setArea(e.target.value)} />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea id="description" placeholder="Describe your property..." rows={5} required maxLength={2000} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => navigate(-1)} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1 gradient-warm border-0 text-primary-foreground" disabled={submitting}>
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
};

export default EditProperty;
