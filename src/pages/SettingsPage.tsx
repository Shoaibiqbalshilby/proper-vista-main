import { Link } from "react-router-dom";
import { ArrowLeft, BriefcaseBusiness, ChevronRight, MapPinned, Shield, SlidersHorizontal, UserCog } from "lucide-react";

const Item = ({ to, title, subtitle }: { to: string; title: string; subtitle: string }) => (
  <Link to={to} className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4 transition-colors hover:bg-accent">
    <div>
      <h3 className="font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
    <ChevronRight className="h-5 w-5 text-muted-foreground" />
  </Link>
);

const SettingsPage = () => {
  return (
    <main className="container py-8">
      <div className="mx-auto max-w-5xl">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <div className="mt-4 rounded-2xl border border-border bg-gradient-to-br from-card to-secondary/30 p-6 md:p-8">
          <h1 className="font-display text-3xl font-bold text-foreground">Settings</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Manage the core app preferences that affect search, account navigation, and location usage.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Permissions</h2>
            <div className="space-y-3">
              <Item to="/privacy-security" title="Location access" subtitle="While using the app" />
              <Item to="/settings" title="Photos access" subtitle="Profile image upload" />
              <Item to="/privacy-security" title="Review location usage" subtitle="See and control privacy behavior" />
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Account</h2>
            <div className="space-y-3">
              <Item to="/business-profile" title="Open business profile" subtitle="Manage your company profile" />
              <Item to="/my-properties" title="Manage my properties" subtitle="View uploaded and saved listings" />
              <Item to="/notification-settings" title="Notifications" subtitle="Control in-app alerts" />
            </div>
          </section>
        </div>

        <div className="mt-8 grid gap-4 rounded-2xl border border-border bg-card p-5 md:grid-cols-4">
          <div className="rounded-xl bg-secondary/50 p-4">
            <SlidersHorizontal className="h-5 w-5 text-primary" />
            <p className="mt-2 text-sm font-medium text-foreground">App controls</p>
          </div>
          <div className="rounded-xl bg-secondary/50 p-4">
            <Shield className="h-5 w-5 text-primary" />
            <p className="mt-2 text-sm font-medium text-foreground">Privacy</p>
          </div>
          <div className="rounded-xl bg-secondary/50 p-4">
            <BriefcaseBusiness className="h-5 w-5 text-primary" />
            <p className="mt-2 text-sm font-medium text-foreground">Business setup</p>
          </div>
          <div className="rounded-xl bg-secondary/50 p-4">
            <UserCog className="h-5 w-5 text-primary" />
            <p className="mt-2 text-sm font-medium text-foreground">Account tools</p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default SettingsPage;
