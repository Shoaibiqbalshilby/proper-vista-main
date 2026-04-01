import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import PropertyCard from "@/components/PropertyCard";
import { useAuth } from "@/contexts/AuthContext";
import { useDbProperties } from "@/hooks/useDbProperties";
import { useSavedProperties } from "@/hooks/useSavedProperties";
import { Heart, Search } from "lucide-react";

const SavedProperties = () => {
  const { user, loading: authLoading } = useAuth();
  const { dbProperties, loading: propsLoading } = useDbProperties();
  const { savedPropertyIds, loading: savedLoading, isSaved, toggleSaved, refreshSaved } = useSavedProperties();

  useEffect(() => {
    refreshSaved();
  }, [refreshSaved]);

  if (authLoading || propsLoading || savedLoading) {
    return (
      <main className="container py-12">
        <p className="text-muted-foreground">Loading saved properties...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="container py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-foreground mb-4">Sign In Required</h1>
        <p className="text-muted-foreground mb-6">Please sign in to view your saved properties.</p>
        <Link to="/auth"><Button>Sign In</Button></Link>
      </main>
    );
  }

  const savedProperties = dbProperties.filter((property) => savedPropertyIds.includes(property.id));

  return (
    <main className="container py-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">Saved Properties</h1>
        <p className="text-muted-foreground">All listings you have bookmarked.</p>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <Heart className="h-4 w-4 text-primary" />
        <h2 className="font-display text-xl font-semibold text-foreground">Saved ({savedProperties.length})</h2>
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
        <div className="rounded-lg border border-border bg-card p-10 text-center">
          <p className="text-muted-foreground mb-4">You do not have any saved properties yet.</p>
          <Link to="/properties">
            <Button variant="outline" className="gap-2"><Search className="h-4 w-4" /> Find Properties</Button>
          </Link>
        </div>
      )}
    </main>
  );
};

export default SavedProperties;
