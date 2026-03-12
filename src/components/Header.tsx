import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Menu, X, LogOut, User, MessageSquare } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import NotificationBell from "@/components/NotificationBell";

const Header = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAuth();

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
            <>
              <Link to={`/profile/${user.id}`}>
                <Button variant={location.pathname.startsWith("/profile") ? "secondary" : "ghost"} size="sm" className="font-body gap-1.5">
                  <User className="h-4 w-4" />
                  Profile
                </Button>
              </Link>
              <Link to="/messages">
                <Button variant={location.pathname === "/messages" ? "secondary" : "ghost"} size="sm" className="font-body gap-1.5">
                  <MessageSquare className="h-4 w-4" />
                  Messages
                </Button>
              </Link>
              <NotificationBell />
              <Button variant="ghost" size="sm" className="font-body gap-1.5" onClick={signOut}>
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </>
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
                <Link to={`/profile/${user.id}`} onClick={() => setMobileOpen(false)}>
                  <Button variant={location.pathname.startsWith("/profile") ? "secondary" : "ghost"} className="w-full justify-start font-body gap-1.5">
                    <User className="h-4 w-4" />
                    Profile
                  </Button>
                </Link>
                <Link to="/messages" onClick={() => setMobileOpen(false)}>
                  <Button variant={location.pathname === "/messages" ? "secondary" : "ghost"} className="w-full justify-start font-body gap-1.5">
                    <MessageSquare className="h-4 w-4" />
                    Messages
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
