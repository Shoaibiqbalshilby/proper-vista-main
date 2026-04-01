import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import PropertyCard from "@/components/PropertyCard";
import { useAuth } from "@/contexts/AuthContext";
import { useDbProperties } from "@/hooks/useDbProperties";
import { useSavedProperties } from "@/hooks/useSavedProperties";
import { supabase } from "@/integrations/supabase/client";
import { Home, Heart, PlusCircle, Search } from "lucide-react";

const MyProperties = () => {
  const { user, loading: authLoading } = useAuth();
  const { dbProperties, loading: propsLoading } = useDbProperties();
  const { savedPropertyIds, loading: savedLoading, isSaved, toggleSaved, refreshSaved } = useSavedProperties();
  const [uploadedPropertyIds, setUploadedPropertyIds] = useState<string[]>([]);
  const [uploadedLoading, setUploadedLoading] = useState(true);

  useEffect(() => {
    const loadUserUploadedProperties = async () => {
      if (!user) {
        setUploadedPropertyIds([]);
        setUploadedLoading(false);
        return;
      }

      setUploadedLoading(true);
      const [{ data: uploadedData }, _] = await Promise.all([
        supabase.from("properties").select("id").eq("user_id", user.id),
        refreshSaved(),
      ]);

      setUploadedPropertyIds((uploadedData ?? []).map((row) => row.id));
      setUploadedLoading(false);
    };

    loadUserUploadedProperties();
  }, [refreshSaved, user]);

  if (authLoading || propsLoading || savedLoading || uploadedLoading) {
    return (
      <main className="container py-12">
        <p className="text-muted-foreground">Loading your properties...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="container py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-foreground mb-4">Sign In Required</h1>
        <p className="text-muted-foreground mb-6">Please sign in to view your properties.</p>
        <Link to="/auth"><Button>Sign In</Button></Link>
      </main>
    );
  }

  const uploadedProperties = dbProperties.filter((property) => uploadedPropertyIds.includes(property.id));
  const savedProperties = dbProperties.filter((property) => savedPropertyIds.includes(property.id));

  return (
    <main className="container py-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">My Properties</h1>
          <p className="text-muted-foreground">Manage your uploaded and saved listings.</p>
        </div>
        <Link to="/list-property">
          <Button className="gradient-warm border-0 text-primary-foreground gap-2">
            <PlusCircle className="h-4 w-4" />
            Add Property
          </Button>
        </Link>
      </div>

      <section className="mb-10">
        <div className="mb-4 flex items-center gap-2">
          <Home className="h-4 w-4 text-primary" />
          <h2 className="font-display text-xl font-semibold text-foreground">Uploaded Properties ({uploadedProperties.length})</h2>
        </div>

        {uploadedProperties.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {uploadedProperties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                showSaveButton
                isSaved={isSaved(property.id)}
                onToggleSave={toggleSaved}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <p className="text-muted-foreground">You have not uploaded any properties yet.</p>
            <Link to="/list-property" className="inline-block mt-4">
              <Button variant="outline">Create your first listing</Button>
            </Link>
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <Heart className="h-4 w-4 text-primary" />
          <h2 className="font-display text-xl font-semibold text-foreground">Saved Properties ({savedProperties.length})</h2>
        </div>

        {savedProperties.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {savedProperties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                showSaveButton
                isSaved={isSaved(property.id)}
                onToggleSave={toggleSaved}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <p className="text-muted-foreground">No saved properties yet.</p>
            <Link to="/properties" className="inline-block mt-4">
              <Button variant="outline" className="gap-2"><Search className="h-4 w-4" /> Browse Properties</Button>
            </Link>
          </div>
        )}
      </section>
    </main>
  );
};

export default MyProperties;
