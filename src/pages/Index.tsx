import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Home, Building2, Trees, MapPin } from "lucide-react";
import PropertyCard from "@/components/PropertyCard";
import { properties } from "@/lib/mockData";
import { useState, useMemo } from "react";
import { useDbProperties } from "@/hooks/useDbProperties";
import heroBg from "@/assets/hero-bg.jpg";

const categories = [
  { icon: Home, label: "Houses", type: "house" },
  { icon: Building2, label: "Apartments", type: "apartment" },
  { icon: Home, label: "Villas", type: "villa" },
  { icon: Trees, label: "Land", type: "land" },
];

const Index = () => {
  const navigate = useNavigate();
  const [searchLocation, setSearchLocation] = useState("");
  const [listingType, setListingType] = useState("");
  const { dbProperties } = useDbProperties();

  const featured = useMemo(() => {
    const allProps = [...dbProperties, ...properties];
    const featuredProps = allProps.filter((p) => p.isFeatured);
    // If no featured, show latest DB properties + some mock
    return featuredProps.length > 0 ? featuredProps : dbProperties.slice(0, 6);
  }, [dbProperties]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchLocation) params.set("location", searchLocation);
    if (listingType) params.set("listing", listingType);
    navigate(`/properties?${params.toString()}`);
  };

  return (
    <main>
      {/* Hero */}
      <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden">
        <img
          src={heroBg}
          alt="Luxury property"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 gradient-hero" />
        <div className="relative z-10 container text-center px-4 animate-fade-in-up">
          <h1 className="font-display text-4xl font-bold text-primary-foreground md:text-6xl lg:text-7xl mb-4">
            Find Your Perfect Property
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-primary-foreground/80 mb-8 font-body">
            Discover premium homes, apartments, villas and land listings from trusted agents and owners.
          </p>

          {/* Search Bar */}
          <div className="mx-auto max-w-3xl rounded-xl bg-card/95 p-3 shadow-elevated backdrop-blur-sm">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by location..."
                  className="pl-9 border-border"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <Select value={listingType} onValueChange={setListingType}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sale">For Sale</SelectItem>
                  <SelectItem value="rent">For Rent</SelectItem>
                  <SelectItem value="short-let">Short Let</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSearch} className="gradient-warm border-0 text-primary-foreground gap-2">
                <Search className="h-4 w-4" /> Search
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container py-16">
        <h2 className="font-display text-3xl font-bold text-foreground text-center mb-10">
          Browse by Category
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {categories.map((cat) => (
            <Link
              key={cat.type}
              to={`/properties?type=${cat.type}`}
              className="group flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 shadow-card transition-all hover:shadow-card-hover hover:-translate-y-1"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary transition-colors group-hover:gradient-warm">
                <cat.icon className="h-6 w-6 text-foreground group-hover:text-primary-foreground transition-colors" />
              </div>
              <span className="font-display font-semibold text-foreground">{cat.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="container pb-20">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-display text-3xl font-bold text-foreground">Featured Properties</h2>
          <Link to="/properties">
            <Button variant="outline">View All</Button>
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      </section>
    </main>
  );
};

export default Index;
