import { Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAlertNotifications } from "@/hooks/useAlertNotifications";
import { formatDistanceToNow } from "date-fns";

const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useAlertNotifications();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative font-body gap-1.5">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="font-display text-sm font-semibold text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} className="text-xs text-primary hover:underline">
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-72 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground text-center">No notifications yet.</p>
          ) : (
            notifications.slice(0, 20).map((n) => (
              <Link
                key={n.id}
                to={`/property/${n.property_id}`}
                onClick={() => { if (!n.is_read) markAsRead(n.id); }}
                className={`block px-4 py-3 border-b border-border last:border-0 hover:bg-accent/50 transition-colors ${!n.is_read ? "bg-primary/5" : ""}`}
              >
                <p className="text-sm font-medium text-foreground line-clamp-1">
                  New match: {n.property_title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                </p>
              </Link>
            ))
          )}
        </div>
        <div className="border-t border-border px-4 py-2">
          <Link to="/alerts" className="text-xs text-primary hover:underline">
            Manage your alerts
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
