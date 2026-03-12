import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface AlertNotification {
  id: string;
  alert_id: string;
  property_id: string;
  property_title: string;
  is_read: boolean;
  created_at: string;
}

export function useAlertNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AlertNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!user) { setNotifications([]); setLoading(false); return; }
    const { data } = await supabase
      .from("alert_notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setNotifications(data as AlertNotification[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();

    if (!user) return;

    // Subscribe to realtime notifications
    const channel = supabase
      .channel("alert-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "alert_notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          setNotifications((prev) => [payload.new as AlertNotification, ...prev]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAsRead = async (id: string) => {
    await supabase.from("alert_notifications").update({ is_read: true } as any).eq("id", id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllAsRead = async () => {
    if (!user) return;
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    await supabase.from("alert_notifications").update({ is_read: true } as any).in("id", unreadIds);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead, refetch: fetchNotifications };
}
