import { Link } from "react-router-dom";
import { ArrowLeft, ChevronRight, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PrivacySecurity = () => {
  const { toast } = useToast();

  const clearSavedLocation = () => {
    localStorage.removeItem("properavista-last-location");
    toast({ title: "Saved location cleared", description: "Local map position has been removed." });
  };

  return (
    <main className="container py-8">
      <div className="mx-auto max-w-3xl">
        <Link to="/settings" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Settings
        </Link>

        <div className="mt-4 rounded-2xl border border-border bg-gradient-to-br from-card to-secondary/30 p-6">
          <h1 className="font-display text-3xl font-bold text-foreground">Privacy & Security</h1>
          <p className="mt-2 text-muted-foreground">
            Properavista requests location only while you actively use Nearby or Map. The app does not request or retain background location access.
          </p>
        </div>

        <section className="mt-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Privacy controls</h2>
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <button
              type="button"
              onClick={clearSavedLocation}
              className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-accent transition-colors"
            >
              <div>
                <p className="font-semibold text-foreground">Clear saved location</p>
                <p className="text-sm text-muted-foreground">Remove the last cached map position from local storage.</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
            <div className="h-px bg-border" />
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="font-semibold text-foreground">How location data is used</p>
                <p className="text-sm text-muted-foreground">Read the in-app summary of the current location behavior.</p>
              </div>
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default PrivacySecurity;
