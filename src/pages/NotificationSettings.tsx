import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const STORAGE_KEY = "properavista-notification-settings";

const NotificationSettings = () => {
  const { toast } = useToast();
  const [savedSearchAlerts, setSavedSearchAlerts] = useState(true);
  const [nearbyListings, setNearbyListings] = useState(true);
  const [accountUpdates, setAccountUpdates] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as {
        savedSearchAlerts?: boolean;
        nearbyListings?: boolean;
        accountUpdates?: boolean;
      };
      setSavedSearchAlerts(parsed.savedSearchAlerts ?? true);
      setNearbyListings(parsed.nearbyListings ?? true);
      setAccountUpdates(parsed.accountUpdates ?? true);
    } catch {
      // Ignore malformed local cache.
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ savedSearchAlerts, nearbyListings, accountUpdates })
    );
    toast({ title: "Preferences saved", description: "Notification settings updated." });
  };

  return (
    <main className="container py-8">
      <div className="mx-auto max-w-3xl">
        <Link to="/settings" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Settings
        </Link>

        <div className="mt-4 rounded-2xl border border-border bg-gradient-to-br from-card to-secondary/30 p-6">
          <h1 className="font-display text-3xl font-bold text-foreground">Notifications</h1>
          <p className="mt-2 text-muted-foreground">Choose which in-app alerts you want to see while using Properavista.</p>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label className="text-lg font-semibold text-foreground">Saved search alerts</Label>
                <p className="text-sm text-muted-foreground">Updates when matching listings appear.</p>
              </div>
              <Switch checked={savedSearchAlerts} onCheckedChange={setSavedSearchAlerts} />
            </div>

            <div className="h-px bg-border" />

            <div className="flex items-center justify-between gap-4">
              <div>
                <Label className="text-lg font-semibold text-foreground">Nearby listings</Label>
                <p className="text-sm text-muted-foreground">Suggestions based on your current search area.</p>
              </div>
              <Switch checked={nearbyListings} onCheckedChange={setNearbyListings} />
            </div>

            <div className="h-px bg-border" />

            <div className="flex items-center justify-between gap-4">
              <div>
                <Label className="text-lg font-semibold text-foreground">Account updates</Label>
                <p className="text-sm text-muted-foreground">Important changes to profile and listing activity.</p>
              </div>
              <Switch checked={accountUpdates} onCheckedChange={setAccountUpdates} />
            </div>
          </div>

          <Button className="mt-8 w-full gradient-warm border-0 text-primary-foreground" onClick={handleSave}>Save Preferences</Button>
        </div>
      </div>
    </main>
  );
};

export default NotificationSettings;
