import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, BriefcaseBusiness, ChevronRight, CircleHelp, Heart, Home, LogOut, Menu, MessageSquare, Settings, Shield, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface ProfileSummary {
  full_name: string | null;
  avatar_url: string | null;
}

interface AccountCounts {
  properties: number;
  favorites: number;
  messages: number;
}

const Header = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [counts, setCounts] = useState<AccountCounts>({
    properties: 0,
    favorites: 0,
    messages: 0,
  });

  useEffect(() => {
    let isMounted = true;

    const loadHeaderData = async () => {
      if (!user) {
        if (!isMounted) return;
        setProfile(null);
        setCounts({ properties: 0, favorites: 0, messages: 0 });
        return;
      }

      const [profileRes, propertiesRes, favoritesRes, messagesRes] = await Promise.all([
        supabase.from("profiles").select("full_name, avatar_url").eq("user_id", user.id).maybeSingle(),
        supabase.from("properties").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("saved_properties").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("messages").select("id", { count: "exact", head: true }).eq("recipient_id", user.id),
      ]);

      if (!isMounted) return;

      setProfile(profileRes.data ?? null);
      setCounts({
        properties: propertiesRes.count ?? 0,
        favorites: favoritesRes.count ?? 0,
        messages: messagesRes.count ?? 0,
      });
    };

    loadHeaderData();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const displayName =
    profile?.full_name ||
    (typeof user?.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null) ||
    user?.email?.split("@")[0] ||
    "User";

  const displayEmail = user?.email || "No email";

  const avatarUrl =
    profile?.avatar_url ||
    (typeof user?.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : null) ||
    (typeof user?.user_metadata?.picture === "string" ? user.user_metadata.picture : null) ||
    undefined;

  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/properties", label: "Browse" },
    { to: "/list-property", label: "List Property" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-warm">
            <Home className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold text-foreground">
            ProperAvista
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link key={link.to} to={link.to}>
              <Button
                variant={location.pathname === link.to ? "secondary" : "ghost"}
                size="sm"
                className="font-body"
              >
                {link.label}
              </Button>
            </Link>
          ))}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-10 w-10 rounded-full p-0">
                  <Avatar className="h-9 w-9 border border-border">
                    <AvatarImage src={avatarUrl} alt={displayName} />
                    <AvatarFallback className="font-semibold">{initials || "U"}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-80 p-0">
                <div className="border-b border-border px-4 py-4">
                  <div className="font-semibold text-foreground">{displayName}</div>
                  <div className="text-sm text-muted-foreground">{displayEmail}</div>
                </div>

                <div className="grid grid-cols-3 border-b border-border">
                  <div className="px-3 py-3 text-center">
                    <div className="font-semibold text-foreground">{counts.properties}</div>
                    <div className="text-xs text-muted-foreground">Properties</div>
                  </div>
                  <div className="border-x border-border px-3 py-3 text-center">
                    <div className="font-semibold text-foreground">{counts.favorites}</div>
                    <div className="text-xs text-muted-foreground">Favorites</div>
                  </div>
                  <div className="px-3 py-3 text-center">
                    <div className="font-semibold text-foreground">{counts.messages}</div>
                    <div className="text-xs text-muted-foreground">Messages</div>
                  </div>
                </div>

                <DropdownMenuLabel className="px-4 pt-3 text-base">Account</DropdownMenuLabel>
                <DropdownMenuItem asChild className="px-4 py-3">
                  <Link to="/my-properties" className="flex w-full items-center gap-3">
                    <User className="h-4 w-4" />
                    <span>My Properties</span>
                    <span className="ml-auto text-muted-foreground"><ChevronRight className="h-4 w-4" /></span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="px-4 py-3">
                  <Link to="/saved-properties" className="flex w-full items-center gap-3">
                    <Heart className="h-4 w-4" />
                    <span>Saved Properties</span>
                    <span className="ml-auto text-muted-foreground"><ChevronRight className="h-4 w-4" /></span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="px-4 py-3">
                  <Link to="/messages" className="flex w-full items-center gap-3">
                    <MessageSquare className="h-4 w-4" />
                    <span>Messages</span>
                    <span className="ml-auto flex items-center gap-2">
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{counts.messages}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuLabel className="px-4 pt-2 text-base">Settings</DropdownMenuLabel>

                <DropdownMenuItem asChild className="px-4 py-3">
                  <Link to="/business-profile" className="flex w-full items-center gap-3">
                    <BriefcaseBusiness className="h-4 w-4" />
                    <span>Business Profile</span>
                    <span className="ml-auto text-muted-foreground"><ChevronRight className="h-4 w-4" /></span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="px-4 py-3">
                  <Link to="/settings" className="flex w-full items-center gap-3">
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                    <span className="ml-auto text-muted-foreground"><ChevronRight className="h-4 w-4" /></span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="px-4 py-3">
                  <Link to="/notification-settings" className="flex w-full items-center gap-3">
                    <Bell className="h-4 w-4" />
                    <span>Notifications</span>
                    <span className="ml-auto text-muted-foreground"><ChevronRight className="h-4 w-4" /></span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="px-4 py-3">
                  <Link to="/privacy-security" className="flex w-full items-center gap-3">
                    <Shield className="h-4 w-4" />
                    <span>Privacy & Security</span>
                    <span className="ml-auto text-muted-foreground"><ChevronRight className="h-4 w-4" /></span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="px-4 py-3">
                  <Link to="/help-support" className="flex w-full items-center gap-3">
                    <CircleHelp className="h-4 w-4" />
                    <span>Help & Support</span>
                    <span className="ml-auto text-muted-foreground"><ChevronRight className="h-4 w-4" /></span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuItem className="px-4 py-3 text-destructive focus:text-destructive" onClick={signOut}>
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                  <span className="ml-auto text-muted-foreground"><ChevronRight className="h-4 w-4" /></span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/auth">
              <Button variant="ghost" size="sm" className="font-body gap-1.5">
                <User className="h-4 w-4" />
                Sign In
              </Button>
            </Link>
          )}
        </nav>

        <button
          className="md:hidden text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-card p-4 md:hidden animate-fade-in">
          <nav className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)}>
                <Button
                  variant={location.pathname === link.to ? "secondary" : "ghost"}
                  className="w-full justify-start font-body"
                >
                  {link.label}
                </Button>
              </Link>
            ))}
            {user ? (
              <>
                <Link to="/my-properties" onClick={() => setMobileOpen(false)}>
                  <Button variant={location.pathname === "/my-properties" ? "secondary" : "ghost"} className="w-full justify-start font-body gap-1.5">
                    <User className="h-4 w-4" />
                    My Properties
                  </Button>
                </Link>
                <Link to="/saved-properties" onClick={() => setMobileOpen(false)}>
                  <Button variant={location.pathname === "/saved-properties" ? "secondary" : "ghost"} className="w-full justify-start font-body gap-1.5">
                    <Heart className="h-4 w-4" />
                    Saved Properties
                  </Button>
                </Link>
                <Link to="/messages" onClick={() => setMobileOpen(false)}>
                  <Button variant={location.pathname === "/messages" ? "secondary" : "ghost"} className="w-full justify-start font-body gap-1.5">
                    <MessageSquare className="h-4 w-4" />
                    Messages
                  </Button>
                </Link>
                <Link to="/notification-settings" onClick={() => setMobileOpen(false)}>
                  <Button variant={location.pathname === "/notification-settings" ? "secondary" : "ghost"} className="w-full justify-start font-body gap-1.5">
                    <Bell className="h-4 w-4" />
                    Notifications
                  </Button>
                </Link>
                <Link to="/settings" onClick={() => setMobileOpen(false)}>
                  <Button variant={location.pathname === "/settings" ? "secondary" : "ghost"} className="w-full justify-start font-body gap-1.5">
                    <Settings className="h-4 w-4" />
                    Settings
                  </Button>
                </Link>
                <Button variant="ghost" className="w-full justify-start font-body gap-1.5" onClick={() => { signOut(); setMobileOpen(false); }}>
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Link to="/auth" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" className="w-full justify-start font-body gap-1.5">
                  <User className="h-4 w-4" />
                  Sign In
                </Button>
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
