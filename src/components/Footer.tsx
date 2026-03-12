import { Home } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="border-t border-border bg-card mt-auto">
    <div className="container py-12">
      <div className="grid gap-8 md:grid-cols-3">
        <div>
          <Link to="/" className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-warm">
              <Home className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold text-foreground">ProperAvista</span>
          </Link>
          <p className="text-sm text-muted-foreground max-w-xs">
            Your trusted platform for finding and listing premium properties across the globe.
          </p>
        </div>
        <div>
          <h4 className="font-display font-semibold text-foreground mb-3">Quick Links</h4>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <Link to="/properties" className="hover:text-primary transition-colors">Browse Properties</Link>
            <Link to="/list-property" className="hover:text-primary transition-colors">List a Property</Link>
          </div>
        </div>
        <div>
          <h4 className="font-display font-semibold text-foreground mb-3">Property Types</h4>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <span>Houses & Villas</span>
            <span>Apartments & Condos</span>
            <span>Land & Plots</span>
          </div>
        </div>
      </div>
      <div className="mt-8 border-t border-border pt-6 text-center text-sm text-muted-foreground">
        © 2026 ProperAvista. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
