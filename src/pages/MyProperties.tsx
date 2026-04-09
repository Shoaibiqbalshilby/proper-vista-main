import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Home, Heart, MoreVertical, Pencil, PlusCircle, Search, Trash2 } from "lucide-react";

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
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import PropertyCard from "@/components/PropertyCard";
import { useAuth } from "@/contexts/AuthContext";
import { useDbProperties } from "@/hooks/useDbProperties";
import { useSavedProperties } from "@/hooks/useSavedProperties";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { extractStorageObjectPaths } from "@/lib/media";
import type { Property } from "@/lib/mockData";

type SupabaseLikeError = {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
};

const getDeleteErrorMessage = (error: unknown) => {
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

  return "Could not delete this property right now.";
};

const MyProperties = () => {
  const { user, loading: authLoading } = useAuth();
  const { dbProperties, loading: propsLoading, refreshProperties } = useDbProperties();
  const { savedPropertyIds, loading: savedLoading, isSaved, toggleSaved, refreshSaved } = useSavedProperties();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);
  const [deletingPropertyId, setDeletingPropertyId] = useState<string | null>(null);

  if (authLoading || propsLoading || savedLoading) {
    return (
      <main className="container py-12">
        <p className="text-muted-foreground">Loading your properties...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="container py-20 text-center">
        <h1 className="mb-4 font-display text-2xl font-bold text-foreground">Sign In Required</h1>
        <p className="mb-6 text-muted-foreground">Please sign in to view your properties.</p>
        <Link to="/auth"><Button>Sign In</Button></Link>
      </main>
    );
  }

  const uploadedProperties = dbProperties.filter((property) => property.userId === user.id);
  const savedProperties = dbProperties.filter((property) => savedPropertyIds.includes(property.id));

  const handleDeleteProperty = async () => {
    if (!propertyToDelete) {
      return;
    }

    const property = propertyToDelete;

    setDeletingPropertyId(property.id);

    try {
      let deleteError: unknown = null;

      const { error: directDeleteError, data: deletedRows } = await supabase
        .from("properties")
        .delete()
        .eq("id", property.id)
        .eq("user_id", user.id)
        .select("id");

      if (directDeleteError) {
        deleteError = directDeleteError;
      } else if (!deletedRows || deletedRows.length === 0) {
        const { error: rpcDeleteError } = await supabase.rpc("delete_property_with_related_records", {
          p_property_id: property.id,
        });

        deleteError = rpcDeleteError;
      }

      if (deleteError) {
        throw deleteError;
      }

      const mediaPaths = extractStorageObjectPaths([...property.images, ...(property.videos ?? [])], "property-media");
      let storageCleanupFailed = false;

      if (mediaPaths.length > 0) {
        const { error: storageError } = await supabase.storage.from("property-media").remove(mediaPaths);
        storageCleanupFailed = Boolean(storageError);
      }

      await Promise.all([refreshProperties(), refreshSaved()]);

      toast({
        title: "Property deleted",
        description: storageCleanupFailed
          ? "The listing was removed. Some old media files could not be cleaned up automatically."
          : "The listing, images, and related records have been removed from ProperVista.",
      });
      setPropertyToDelete(null);
    } catch (error) {
      const message = getDeleteErrorMessage(error);
      toast({
        title: "Delete failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setDeletingPropertyId(null);
    }
  };

  return (
    <main className="container py-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">My Properties</h1>
          <p className="text-muted-foreground">Manage your uploaded and saved listings.</p>
        </div>
        <Link to="/list-property">
          <Button className="gap-2 border-0 gradient-warm text-primary-foreground">
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
              <div key={property.id} className="relative">
                <div className="absolute right-3 top-3 z-20">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 rounded-full bg-card/95"
                        aria-label={`Manage ${property.title}`}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem onSelect={() => navigate(`/edit-property/${property.id}`)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit Property
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onSelect={() => setPropertyToDelete(property)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Property
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <PropertyCard property={property} />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <p className="text-muted-foreground">You have not uploaded any properties yet.</p>
            <Link to="/list-property" className="mt-4 inline-block">
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
            <Link to="/properties" className="mt-4 inline-block">
              <Button variant="outline" className="gap-2"><Search className="h-4 w-4" /> Browse Properties</Button>
            </Link>
          </div>
        )}
      </section>

      <AlertDialog open={Boolean(propertyToDelete)} onOpenChange={(open) => !open && setPropertyToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Property</AlertDialogTitle>
            <AlertDialogDescription>
              {propertyToDelete
                ? `Delete "${propertyToDelete.title}" from My Properties, Browse, the home page, and Supabase storage. This action cannot be undone.`
                : "Delete this property permanently."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(deletingPropertyId)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleDeleteProperty();
              }}
              disabled={Boolean(deletingPropertyId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingPropertyId ? "Deleting..." : "Delete Property"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
};

export default MyProperties;