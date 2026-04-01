import { Link } from "react-router-dom";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const HelpSupport = () => {
  const { toast } = useToast();

  const openPlaceholder = () => {
    toast({ title: "Support", description: "Support ticket flow will be connected here." });
  };

  return (
    <main className="container py-8">
      <div className="mx-auto max-w-3xl">
        <Link to="/settings" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Settings
        </Link>

        <div className="mt-4 rounded-2xl border border-border bg-gradient-to-br from-card to-secondary/30 p-6">
          <h1 className="font-display text-3xl font-bold text-foreground">Help & Support</h1>
          <p className="mt-2 text-muted-foreground">
            Quick answers for common questions about listings, saved properties, and location-based browsing.
          </p>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
          <button type="button" className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-accent transition-colors">
            <div>
              <p className="font-semibold text-foreground">How does Nearby search work?</p>
              <p className="text-sm text-muted-foreground">Learn how local results are generated.</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
          <div className="h-px bg-border" />
          <button type="button" className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-accent transition-colors">
            <div>
              <p className="font-semibold text-foreground">How do I save a property?</p>
              <p className="text-sm text-muted-foreground">See how favorites work in the app.</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
          <div className="h-px bg-border" />
          <button type="button" onClick={openPlaceholder} className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-accent transition-colors">
            <div>
              <p className="font-semibold text-foreground">Contact support</p>
              <p className="text-sm text-muted-foreground">Open the current support placeholder.</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </div>
    </main>
  );
};

export default HelpSupport;
