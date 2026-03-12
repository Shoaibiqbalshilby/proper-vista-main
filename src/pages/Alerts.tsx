import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePropertyAlerts } from "@/hooks/usePropertyAlerts";
import { useAlertNotifications } from "@/hooks/useAlertNotifications";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { BellPlus, Trash2, MapPin, Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { propertyTypeLabels, listingTypeLabels } from "@/lib/mockData";
import CreateAlertDialog from "@/components/CreateAlertDialog";

const Alerts = () => {
  const { user } = useAuth();
  const { alerts, loading, deleteAlert, toggleAlert } = usePropertyAlerts();
  const { notifications, markAsRead } = useAlertNotifications();

  if (!user) {
    return (
      <main className="container py-20 text-center">
        <Bell className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
        <h1 className="font-display text-2xl font-bold text-foreground mb-2">Property Alerts</h1>
        <p className="text-muted-foreground mb-4">Sign in to create alerts and get notified about new listings.</p>
        <Link to="/auth"><Button>Sign In</Button></Link>
      </main>
    );
  }

  return (
    <main className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Property Alerts</h1>
          <p className="text-muted-foreground text-sm mt-1">Get notified when new properties match your criteria.</p>
        </div>
        <CreateAlertDialog />
      </div>

      {/* Saved Alerts */}
      <h2 className="font-display text-lg font-semibold text-foreground mb-3">Your Alerts</h2>
      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : alerts.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center mb-8">
          <BellPlus className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">No alerts yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="grid gap-3 mb-8">
          {alerts.map((alert) => (
            <div key={alert.id} className="rounded-lg border border-border bg-card p-4 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-display font-semibold text-foreground">{alert.name}</h3>
                  {!alert.is_active && <Badge variant="outline">Paused</Badge>}
                </div>
                <div className="flex flex-wrap gap-2 mt-1.5 text-xs text-muted-foreground">
                  {alert.location && (
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{alert.location}</span>
                  )}
                  {alert.listing_type && (
                    <Badge variant="secondary" className="text-xs">{listingTypeLabels[alert.listing_type as keyof typeof listingTypeLabels] || alert.listing_type}</Badge>
                  )}
                  {alert.property_type && (
                    <Badge variant="secondary" className="text-xs">{propertyTypeLabels[alert.property_type as keyof typeof propertyTypeLabels] || alert.property_type}</Badge>
                  )}
                  {alert.min_bedrooms && <span>{alert.min_bedrooms}+ beds</span>}
                  {alert.min_bathrooms && <span>{alert.min_bathrooms}+ baths</span>}
                  {(alert.min_price || alert.max_price) && (
                    <span>
                      ₦{alert.min_price?.toLocaleString() || "0"} – ₦{alert.max_price?.toLocaleString() || "∞"}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Switch checked={alert.is_active} onCheckedChange={(v) => toggleAlert(alert.id, v)} />
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteAlert(alert.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent Notifications */}
      <h2 className="font-display text-lg font-semibold text-foreground mb-3">Recent Notifications</h2>
      {notifications.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <Bell className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">No notifications yet. They'll appear here when matching properties are listed.</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {notifications.map((n) => (
            <Link
              key={n.id}
              to={`/property/${n.property_id}`}
              onClick={() => { if (!n.is_read) markAsRead(n.id); }}
              className={`rounded-lg border border-border bg-card p-4 flex items-center justify-between hover:bg-accent/50 transition-colors ${!n.is_read ? "border-primary/30 bg-primary/5" : ""}`}
            >
              <div>
                <p className="font-medium text-foreground text-sm">{n.property_title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                </p>
              </div>
              {!n.is_read && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
            </Link>
          ))}
        </div>
      )}
    </main>
  );
};

export default Alerts;
