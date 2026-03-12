export type PropertyType = "house" | "apartment" | "villa" | "land" | "condo";
export type ListingType = "sale" | "rent" | "short-let";

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  priceLabel: string;
  propertyType: PropertyType;
  listingType: ListingType;
  location: string;
  address: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  images: string[];
  videos?: string[];
  features: string[];
  nearbyPlaces: { name: string; type: string; distance: string }[];
  agent: {
    name: string;
    company: string;
    phone: string;
    email: string;
    avatar: string;
  };
  createdAt: string;
  isFeatured: boolean;
  status?: string;
}

export const nigerianLocations = [
  "Lagos", "Abuja (FCT)", "Port Harcourt, Rivers", "Ibadan, Oyo", "Kano, Kano",
  "Enugu, Enugu", "Benin City, Edo", "Calabar, Cross River", "Uyo, Akwa Ibom",
  "Warri, Delta", "Asaba, Delta", "Owerri, Imo", "Abeokuta, Ogun", "Jos, Plateau",
  "Kaduna, Kaduna", "Ilorin, Kwara", "Akure, Ondo", "Osogbo, Osun", "Ado-Ekiti, Ekiti",
  "Maiduguri, Borno", "Bauchi, Bauchi", "Yola, Adamawa", "Sokoto, Sokoto", "Katsina, Katsina",
  "Minna, Niger", "Makurdi, Benue", "Abakaliki, Ebonyi", "Awka, Anambra", "Umuahia, Abia",
  "Aba, Abia", "Onitsha, Anambra", "Ikeja, Lagos", "Victoria Island, Lagos",
  "Lekki, Lagos", "Ikoyi, Lagos", "Ajah, Lagos", "Surulere, Lagos",
  "Wuse, Abuja", "Maitama, Abuja", "Gwarinpa, Abuja", "Asokoro, Abuja", "Jabi, Abuja",
  "GRA, Port Harcourt", "Trans Amadi, Port Harcourt", "Bodija, Ibadan",
];

export const properties: Property[] = [
  {
    id: "1",
    title: "Exquisite 5-Bedroom Detached Villa with Pool",
    description: "Stunning 5-bedroom detached villa in the heart of Lekki Phase 1 featuring floor-to-ceiling windows, a private infinity pool, landscaped gardens, and breathtaking lagoon views. The open-plan living area flows seamlessly to the outdoor entertainment space. Chef's kitchen with premium appliances, home theater, and a wine cellar. 24-hour security and power supply.",
    price: 950000000,
    priceLabel: "₦950,000,000",
    propertyType: "villa",
    listingType: "sale",
    location: "Lekki, Lagos",
    address: "12 Admiral Ayinla Crescent, Lekki Phase 1, Lagos",
    bedrooms: 5,
    bathrooms: 4,
    area: 4500,
    images: [
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
    ],
    features: ["Swimming Pool", "Lagoon View", "Smart Home", "BQ", "Home Theater", "3-Car Garage"],
    nearbyPlaces: [
      { name: "Lekki British School", type: "School", distance: "1.2 km" },
      { name: "St. Nicholas Hospital", type: "Hospital", distance: "3.5 km" },
      { name: "Circle Mall Lekki", type: "Shopping", distance: "2.0 km" },
      { name: "Lekki Leisure Lake", type: "Recreation", distance: "0.8 km" },
    ],
    agent: { name: "Adaeze Okonkwo", company: "PrimeHomes Realty", phone: "+234 802 345 6789", email: "adaeze@primehomes.ng", avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&q=80" },
    createdAt: "2026-02-15",
    isFeatured: true,
  },
  {
    id: "2",
    title: "Luxury 3-Bedroom Penthouse Apartment",
    description: "Sleek penthouse in Victoria Island with floor-to-ceiling windows offering sweeping views of the Lagos skyline and Atlantic Ocean. Features include a gourmet kitchen with marble countertops, private rooftop terrace, and concierge service. Walking distance to Eko Atlantic and fine dining.",
    price: 5500000,
    priceLabel: "₦5,500,000/mo",
    propertyType: "apartment",
    listingType: "rent",
    location: "Victoria Island, Lagos",
    address: "15 Adeola Odeku Street, Victoria Island, Lagos",
    bedrooms: 3,
    bathrooms: 2,
    area: 2200,
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
    ],
    features: ["Ocean View", "Rooftop Terrace", "Concierge", "Gym", "24hr Power", "CCTV Security"],
    nearbyPlaces: [
      { name: "Corona School VI", type: "School", distance: "0.9 km" },
      { name: "Reddington Hospital", type: "Hospital", distance: "1.5 km" },
      { name: "The Palms Shopping Mall", type: "Shopping", distance: "2.3 km" },
      { name: "Bar Beach", type: "Recreation", distance: "1.0 km" },
    ],
    agent: { name: "Chinedu Eze", company: "Metro Living Lagos", phone: "+234 803 456 7890", email: "chinedu@metroliving.ng", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80" },
    createdAt: "2026-02-10",
    isFeatured: true,
  },
  {
    id: "3",
    title: "Spacious 4-Bedroom Semi-Detached House",
    description: "Beautiful 4-bedroom semi-detached duplex in a serene estate in Maitama, Abuja. Recently renovated with modern finishes. Features a spacious compound, updated kitchen, tiled floors throughout, boys' quarters, and a two-car garage. Close to embassies and international schools.",
    price: 350000000,
    priceLabel: "₦350,000,000",
    propertyType: "house",
    listingType: "sale",
    location: "Maitama, Abuja",
    address: "Plot 45, Yedseram Street, Maitama, Abuja",
    bedrooms: 4,
    bathrooms: 3,
    area: 2800,
    images: [
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80",
    ],
    features: ["BQ", "Tiled Floors", "Renovated Kitchen", "Garage", "Estate Security", "Central AC"],
    nearbyPlaces: [
      { name: "Whiteplains British School", type: "School", distance: "1.8 km" },
      { name: "Maitama District Hospital", type: "Hospital", distance: "2.0 km" },
      { name: "Jabi Lake Mall", type: "Shopping", distance: "4.5 km" },
      { name: "Millennium Park", type: "Recreation", distance: "3.0 km" },
    ],
    agent: { name: "Fatima Bello", company: "Capital City Realtors", phone: "+234 806 789 0123", email: "fatima@capitalcity.ng", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80" },
    createdAt: "2026-02-18",
    isFeatured: false,
  },
  {
    id: "4",
    title: "Furnished Waterfront Apartment - Short Let",
    description: "Wake up to stunning waterfront views in this beautifully furnished apartment in Banana Island, Ikoyi. Perfect for business travellers and vacation stays. Fully equipped kitchen, private balcony overlooking the lagoon, and access to resort-style amenities including pool and gym.",
    price: 180000,
    priceLabel: "₦180,000/night",
    propertyType: "condo",
    listingType: "short-let",
    location: "Ikoyi, Lagos",
    address: "3 Banana Island Road, Ikoyi, Lagos",
    bedrooms: 2,
    bathrooms: 2,
    area: 1100,
    images: [
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
      "https://images.unsplash.com/photo-1560185127-6a3c65a1f5f0?w=800&q=80",
      "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80",
    ],
    features: ["Waterfront", "Fully Furnished", "Balcony", "Pool", "Gym", "24hr Power"],
    nearbyPlaces: [
      { name: "Greensprings School", type: "School", distance: "2.5 km" },
      { name: "Lagoon Hospital Ikoyi", type: "Hospital", distance: "1.2 km" },
      { name: "Falomo Shopping Centre", type: "Shopping", distance: "1.8 km" },
      { name: "Ikoyi Club", type: "Recreation", distance: "2.0 km" },
    ],
    agent: { name: "Olumide Fashola", company: "Naija Stays", phone: "+234 810 234 5678", email: "olumide@naijastays.ng", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80" },
    createdAt: "2026-02-20",
    isFeatured: true,
  },
  {
    id: "5",
    title: "Prime Development Land - 2 Plots",
    description: "Two plots of dry, buildable land with C of O in a fast-developing area of Asokoro, Abuja. Existing road access and utilities at the boundary. Perfect for residential or commercial development. Surrounded by established neighborhoods with excellent schools nearby.",
    price: 500000000,
    priceLabel: "₦500,000,000",
    propertyType: "land",
    listingType: "sale",
    location: "Asokoro, Abuja",
    address: "Off Asokoro Extension, Asokoro, Abuja",
    bedrooms: 0,
    bathrooms: 0,
    area: 435600,
    images: [
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80",
      "https://images.unsplash.com/photo-1628624747186-a941c476b7ef?w=800&q=80",
    ],
    features: ["C of O", "Road Access", "Utilities Available", "Flat Terrain", "Fenced", "Corner Piece"],
    nearbyPlaces: [
      { name: "Lead British International School", type: "School", distance: "3.0 km" },
      { name: "National Hospital Abuja", type: "Hospital", distance: "5.2 km" },
      { name: "Asokoro Shopping Complex", type: "Shopping", distance: "2.5 km" },
    ],
    agent: { name: "Ibrahim Musa", company: "Abuja Land Deals", phone: "+234 809 567 8901", email: "ibrahim@abujaland.ng", avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&q=80" },
    createdAt: "2026-02-12",
    isFeatured: false,
  },
  {
    id: "6",
    title: "Elegant 4-Bedroom Terrace Duplex",
    description: "Beautifully finished terrace duplex in GRA Phase 2, Port Harcourt. Features spacious rooms with modern interiors, fitted kitchen, en-suite bedrooms, private garden, and rooftop lounge. Located in a gated estate with 24-hour security. Close to shopping malls and schools.",
    price: 120000000,
    priceLabel: "₦120,000,000",
    propertyType: "house",
    listingType: "sale",
    location: "GRA, Port Harcourt",
    address: "22 Tombia Street, GRA Phase 2, Port Harcourt, Rivers",
    bedrooms: 4,
    bathrooms: 3,
    area: 3200,
    images: [
      "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&q=80",
      "https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=800&q=80",
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80",
    ],
    features: ["Gated Estate", "Garden", "Rooftop Lounge", "Fitted Kitchen", "BQ", "24hr Security"],
    nearbyPlaces: [
      { name: "Graceland International School", type: "School", distance: "1.5 km" },
      { name: "University of Port Harcourt Teaching Hospital", type: "Hospital", distance: "6.0 km" },
      { name: "Genesis Deluxe Cinemas", type: "Shopping", distance: "3.2 km" },
      { name: "Port Harcourt Golf Club", type: "Recreation", distance: "2.8 km" },
    ],
    agent: { name: "Ngozi Amadi", company: "Rivers Realty", phone: "+234 812 678 9012", email: "ngozi@riversrealty.ng", avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&q=80" },
    createdAt: "2026-02-08",
    isFeatured: true,
  },
];

export const propertyTypeLabels: Record<PropertyType, string> = {
  house: "House",
  apartment: "Apartment",
  villa: "Villa",
  land: "Land",
  condo: "Condo",
};

export const listingTypeLabels: Record<ListingType, string> = {
  sale: "For Sale",
  rent: "For Rent",
  "short-let": "Short Let",
};
