import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef } from "react";
import { propertyTypeLabels, listingTypeLabels } from "@/lib/mockData";
import { ImagePlus, Video, X, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type SupabaseLikeError = {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
};

type UploadedObject = {
  bucket: string;
  path: string;
  publicUrl: string;
};

type PropertyInsertPayload = Record<string, unknown>;

const getSupabaseErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (error && typeof error === "object") {
    const supabaseError = error as SupabaseLikeError;
    const parts = [supabaseError.message, supabaseError.details, supabaseError.hint].filter(Boolean);
    if (parts.length > 0) {
      return parts.join(" ");
    }
  }

  return "Failed to list property. Please try again.";
};

const tryExtractUnknownColumn = (errorMessage: string) => {
  const patterns = [
    /Could not find the '([^']+)' column/i,
    /column\s+"?([a-zA-Z0-9_]+)"?\s+does not exist/i,
  ];

  for (const pattern of patterns) {
    const match = errorMessage.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
};

const isBucketNotFoundError = (error: unknown) => {
  const message = getSupabaseErrorMessage(error).toLowerCase();
  return message.includes("bucket not found") || message.includes("not found");
};

const configuredBucket = (import.meta.env.VITE_PROPERTY_MEDIA_BUCKET || "").trim();
const fallbackBuckets = [configuredBucket, "property-images", "property-media", "property_media"].filter(
  (bucket, index, arr): bucket is string => Boolean(bucket) && arr.indexOf(bucket) === index,
);

const generateUploadId = () => {
  const cryptoObj = globalThis.crypto;
  if (cryptoObj?.randomUUID) {
    return cryptoObj.randomUUID();
  }

  if (cryptoObj?.getRandomValues) {
    const bytes = cryptoObj.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"));
    return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`;
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const uploadSingleFile = async (file: File, path: string): Promise<UploadedObject> => {
  let lastError: unknown = null;

  for (const bucket of fallbackBuckets) {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (error || !data?.path) {
      lastError = error || new Error("Upload failed");
      if (isBucketNotFoundError(lastError)) {
        continue;
      }
      throw lastError;
    }

    const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return {
      bucket,
      path: data.path,
      publicUrl: publicData.publicUrl,
    };
  }

  throw lastError || new Error("Media storage bucket not found");
};

const buildPaymentFrequency = (listingType: string) => {
  if (listingType === "rent") return { rent: "monthly" };
  if (listingType === "short-let") return { short_let: "nightly" };
  return null;
};

const splitLocation = (value: string) => {
  const parts = value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    city: parts[0] || value || "Unknown",
    state: parts[1] || "Unknown",
  };
};

const insertPropertyWithCompatibility = async (payloadCandidates: PropertyInsertPayload[]) => {
  let lastError: unknown = null;

  for (const candidate of payloadCandidates) {
    const payload: PropertyInsertPayload = { ...candidate };

    for (let attempt = 0; attempt < 12; attempt += 1) {
      const { data, error } = await supabase
        .from("properties")
        .insert(payload)
        .select("id")
        .single();

      if (!error) {
        return data?.id ?? null;
      }

      const message = getSupabaseErrorMessage(error);
      const unknownColumn = tryExtractUnknownColumn(message);

      if (unknownColumn && unknownColumn in payload) {
        delete payload[unknownColumn];
        continue;
      }

      lastError = error;
      break;
    }
  }

  throw lastError || new Error("Failed to insert property");
};

const ListProperty = () => {
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const [videos, setVideos] = useState<{ file: File; preview: string }[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Form state
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages = files.filter(f => f.type.startsWith("image/")).slice(0, 10 - images.length).map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages(prev => [...prev, ...newImages]);
    e.target.value = "";
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newVideos = files.filter(f => f.type.startsWith("video/")).slice(0, 3 - videos.length).map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setVideos(prev => [...prev, ...newVideos]);
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const removeVideo = (index: number) => {
    setVideos(prev => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const formatPriceLabel = (priceVal: number, lt: string) => {
    const formatted = `₦${priceVal.toLocaleString()}`;
    if (lt === "rent") return `${formatted}/mo`;
    if (lt === "short-let") return `${formatted}/night`;
    return formatted;
  };

  const uploadFilesToStorage = async (files: File[], folder: "images" | "videos") => {
    const uploadedUrls: string[] = [];
    const uploadedObjects: UploadedObject[] = [];

    for (const file of files) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${user?.id}/${folder}/${Date.now()}-${generateUploadId()}-${safeName}`;

      const uploadedObject = await uploadSingleFile(file, path);
      uploadedUrls.push(uploadedObject.publicUrl);
      uploadedObjects.push(uploadedObject);
    }

    return { uploadedUrls, uploadedObjects };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !propertyType || !listingType) {
      toast({
        title: "Missing required details",
        description: "Please complete property type and listing type before submitting.",
        variant: "destructive",
      });
      return;
    }

    const uploadedObjectsForRollback: UploadedObject[] = [];
    let skippedMediaBecauseBucketMissing = false;

    setSubmitting(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("Your session expired. Please sign in again and retry.");
      }

      const priceNum = Number(price);
      if (!Number.isFinite(priceNum) || priceNum <= 0) {
        throw new Error("Please enter a valid price greater than zero.");
      }

      let uploadedImageUrls: string[] = [];
      let uploadedVideoUrls: string[] = [];

      try {
        const imageUpload = await uploadFilesToStorage(images.map((img) => img.file), "images");
        uploadedObjectsForRollback.push(...imageUpload.uploadedObjects);

        const videoUpload = await uploadFilesToStorage(videos.map((vid) => vid.file), "videos");
        uploadedObjectsForRollback.push(...videoUpload.uploadedObjects);

        uploadedImageUrls = imageUpload.uploadedUrls;
        uploadedVideoUrls = videoUpload.uploadedUrls;
      } catch (mediaError) {
        if (!isBucketNotFoundError(mediaError)) {
          throw mediaError;
        }

        skippedMediaBecauseBucketMissing = true;
        uploadedImageUrls = [];
        uploadedVideoUrls = [];
      }

      let computedArea = Number(area) || 0;
      const landFeatures: string[] = [];
      if (propertyType === "land" && landSize) {
        const size = Number(landSize);
        landFeatures.push(`${size} ${landUnit}`);
        // Convert to sqft for storage
        if (landUnit === "plots") computedArea = Math.round(size * 5382);
        else if (landUnit === "acres") computedArea = Math.round(size * 43560);
        else if (landUnit === "hectares") computedArea = Math.round(size * 107639);
      }

      const { city, state } = splitLocation(location);
      const metadata = (user.user_metadata || {}) as Record<string, unknown>;
      const listerName = typeof metadata.full_name === "string" && metadata.full_name.trim().length > 0
        ? metadata.full_name
        : "Property Owner";

      const modernPayload: PropertyInsertPayload = {
        user_id: user.id,
        title,
        price: priceNum,
        address: location,
        city,
        state,
        zip_code: "000000",
        description,
        bedrooms: Number(bedrooms) || 0,
        bathrooms: Number(bathrooms) || 0,
        square_feet: computedArea,
        images: uploadedImageUrls,
        is_featured: false,
        property_type: propertyType,
        amenities: landFeatures,
        year_built: new Date().getFullYear(),
        latitude: 6.5244,
        longitude: 3.3792,
        listing_type: listingType,
        payment_frequency: buildPaymentFrequency(listingType),
        listing_status: "available",
        land_details: propertyType === "land"
          ? { unit: landUnit, size: Number(landSize) || 0 }
          : null,
        lister: {
          name: listerName,
          phone: typeof metadata.phone === "string" ? metadata.phone : "",
          address: location,
          whatsapp: typeof metadata.phone === "string" ? metadata.phone : "",
          companyName: typeof metadata.company_name === "string" ? metadata.company_name : "",
          description: "",
        },
        nearby_facilities: [],
      };

      const legacyPayload: PropertyInsertPayload = {
        user_id: user.id,
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
        images: uploadedImageUrls,
        features: landFeatures,
        videos: uploadedVideoUrls,
        status: "available",
      };

      let insertedPropertyId: string | null = null;
      insertedPropertyId = await insertPropertyWithCompatibility([modernPayload, legacyPayload]);

      // Check property alerts for matching users
      const priceNum2 = Number(price);
      supabase.functions.invoke("check-property-alerts", {
        body: {
          property: {
            id: insertedPropertyId || generateUploadId(),
            title,
            location,
            listing_type: listingType,
            property_type: propertyType,
            bedrooms: Number(bedrooms) || 0,
            bathrooms: Number(bathrooms) || 0,
            price: priceNum2,
            price_label: formatPriceLabel(priceNum2, listingType),
            user_id: user.id,
          },
        },
      }).catch(console.error);

      setSubmitted(true);
      toast({
        title: skippedMediaBecauseBucketMissing ? "Property Listed (Without Media)" : "Property Listed!",
        description: skippedMediaBecauseBucketMissing
          ? "Your details were saved, but image/video upload was skipped because Supabase media bucket is missing."
          : "Your property is now live on ProperAvista.",
      });
    } catch (error: unknown) {
      console.error("Error listing property:", error);
      if (uploadedObjectsForRollback.length > 0) {
        const bucketToPaths = new Map<string, string[]>();
        for (const item of uploadedObjectsForRollback) {
          const existing = bucketToPaths.get(item.bucket) || [];
          existing.push(item.path);
          bucketToPaths.set(item.bucket, existing);
        }

        for (const [bucket, paths] of bucketToPaths.entries()) {
          const { error: cleanupError } = await supabase.storage.from(bucket).remove(paths);
          if (cleanupError) {
            console.error("Failed to rollback uploaded files:", cleanupError);
          }
        }
      }

      toast({
        title: "Error",
        description: getSupabaseErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="container py-20 text-center">
        <p className="text-muted-foreground">Loading...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="container py-20 text-center animate-fade-in">
        <div className="mx-auto max-w-md">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <LogIn className="h-7 w-7 text-muted-foreground" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-3">Sign In Required</h1>
          <p className="text-muted-foreground mb-6">You need an account to list a property on ProperAvista.</p>
          <Link to="/auth">
            <Button className="gradient-warm border-0 text-primary-foreground">Sign In or Create Account</Button>
          </Link>
        </div>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="container py-20 text-center animate-fade-in">
        <div className="mx-auto max-w-md">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full gradient-warm">
            <span className="text-3xl text-primary-foreground">✓</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-3">Property Listed!</h1>
          <p className="text-muted-foreground mb-6">Your property is now live on ProperAvista.</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => setSubmitted(false)} variant="outline">List Another</Button>
            <Link to={`/profile/${user.id}`}><Button>View Your Profile</Button></Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container py-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">List Your Property</h1>
        <p className="text-muted-foreground mb-8">Fill out the form below to list your property on ProperAvista.</p>

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

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Property Images (up to 10)</Label>
            <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {images.map((img, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-border group">
                  <img src={img.preview} alt={`Property ${i + 1}`} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {images.length < 10 && (
                <button type="button" onClick={() => imageInputRef.current?.click()} className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                  <ImagePlus className="h-6 w-6" />
                  <span className="text-xs">Add</span>
                </button>
              )}
            </div>
          </div>

          {/* Video Upload */}
          <div className="space-y-2">
            <Label>Property Videos (up to 3)</Label>
            <input ref={videoInputRef} type="file" accept="video/*" multiple className="hidden" onChange={handleVideoSelect} />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {videos.map((vid, i) => (
                <div key={i} className="relative aspect-video rounded-lg overflow-hidden border border-border group">
                  <video src={vid.preview} className="w-full h-full object-cover" muted />
                  <button type="button" onClick={() => removeVideo(i)} className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {videos.length < 3 && (
                <button type="button" onClick={() => videoInputRef.current?.click()} className="aspect-video rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                  <Video className="h-6 w-6" />
                  <span className="text-xs">Add Video</span>
                </button>
              )}
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full gradient-warm border-0 text-primary-foreground" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Listing"}
          </Button>
        </form>
      </div>
    </main>
  );
};

export default ListProperty;
