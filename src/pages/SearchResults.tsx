import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { SlidersHorizontal, Grid3X3, List, MapPin, PlusCircle } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { GarageCard } from "@/components/GarageCard";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

const mockGarages = [
  {
    id: "1",
    name: "AutoCare Pro Center",
    location: "Manhattan, New York",
    address: "123 Main Street, Manhattan, NY 10001",
    rating: 4.9,
    reviewCount: 342,
    tags: ["General Service", "AC Repair", "Multi-brand"],
    imageUrl: "https://images.unsplash.com/photo-1625047509248-ec889cbff17f?w=600&h=400&fit=crop",
    isVerified: true,
    isCertified: true,
    isRecommended: true,
    hasDiscounts: true,
    responseTime: "30-45 mins",
    quotesThisMonth: 125,
    walkInWelcome: true,
  },
  {
    id: "2",
    name: "Elite Motors Workshop",
    location: "Brooklyn, New York",
    address: "456 Park Avenue, Brooklyn, NY 11201",
    rating: 4.8,
    reviewCount: 287,
    tags: ["Premium Cars", "Diagnostics", "Body Work"],
    imageUrl: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600&h=400&fit=crop",
    isVerified: true,
    isCertified: true,
    isRecommended: false,
    hasDiscounts: true,
    responseTime: "1-2 hours",
    quotesThisMonth: 89,
  },
  {
    id: "3",
    name: "SpeedFix Auto Service",
    location: "Queens, New York",
    address: "789 Queens Blvd, Queens, NY 11101",
    rating: 4.7,
    reviewCount: 198,
    tags: ["Tyres", "General Service", "All Brands"],
    imageUrl: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=600&h=400&fit=crop",
    isVerified: true,
    isCertified: false,
    isRecommended: true,
    hasDiscounts: false,
    responseTime: "45-60 mins",
    quotesThisMonth: 67,
    walkInWelcome: true,
  },
  {
    id: "4",
    name: "Premier Auto Care",
    location: "Bronx, New York",
    address: "321 Grand Concourse, Bronx, NY 10451",
    rating: 4.8,
    reviewCount: 256,
    tags: ["EV-friendly", "Diagnostics", "All Brands"],
    imageUrl: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&h=400&fit=crop",
    isVerified: true,
    isCertified: true,
    isRecommended: true,
    hasDiscounts: true,
    responseTime: "30 mins",
    quotesThisMonth: 156,
  },
  {
    id: "5",
    name: "City Garage Masters",
    location: "Staten Island, New York",
    address: "555 Victory Blvd, Staten Island, NY 10301",
    rating: 4.6,
    reviewCount: 167,
    tags: ["24/7 Service", "AC Repair", "General Service"],
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop",
    isVerified: true,
    isCertified: false,
    isRecommended: false,
    hasDiscounts: true,
    quotesThisMonth: 45,
    walkInWelcome: true,
  },
  {
    id: "6",
    name: "Precision Auto Works",
    location: "Harlem, New York",
    address: "888 Malcolm X Blvd, Harlem, NY 10027",
    rating: 4.5,
    reviewCount: 143,
    tags: ["German Cars", "Diagnostics", "Premium Cars"],
    imageUrl: "https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?w=600&h=400&fit=crop",
    isVerified: true,
    isCertified: true,
    isRecommended: false,
    hasDiscounts: false,
    responseTime: "1 hour",
    quotesThisMonth: 38,
  },
];

const filterTags = [
  "Quick Service",
  "Affordable",
  "Professional",
  "Luxury Cars",
  "All Brands",
  "24/7 Service",
  "Warranty",
  "Certified",
];

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("rating");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const city = searchParams.get("city") || "New York";
  const query = searchParams.get("q") || "";

  // Filter garages based on search query
  const filteredGarages = query
    ? mockGarages.filter((g) => g.name.toLowerCase().includes(query.toLowerCase()))
    : mockGarages;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <MapPin className="w-4 h-4" />
            <span>Showing results in</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            {query ? `"${query}" in ${city}` : `Garages in ${city}`}
          </h1>
          <p className="text-muted-foreground mt-2">
            {filteredGarages.length} garages found
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden gap-2"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </Button>
          
          <div className="flex items-center gap-4">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="reviews">Most Reviews</SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="hidden md:flex items-center gap-1 bg-secondary rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-2 rounded-md transition-colors",
                  viewMode === "grid" ? "bg-card shadow-sm" : "hover:bg-card/50"
                )}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-2 rounded-md transition-colors",
                  viewMode === "list" ? "bg-card shadow-sm" : "hover:bg-card/50"
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <aside className={cn(
            "w-full md:w-64 flex-shrink-0",
            showFilters ? "block" : "hidden md:block"
          )}>
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border sticky top-24">
              <h3 className="font-semibold text-foreground mb-4">Filters</h3>
              
              {/* Rating Filter */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-foreground mb-3">Minimum Rating</h4>
                <Select defaultValue="any">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Rating</SelectItem>
                    <SelectItem value="4.5">4.5+ Stars</SelectItem>
                    <SelectItem value="4">4+ Stars</SelectItem>
                    <SelectItem value="3.5">3.5+ Stars</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tags Filter */}
              <div>
                <h4 className="text-sm font-medium text-foreground mb-3">Service Tags</h4>
                <div className="space-y-2">
                  {filterTags.map((tag) => (
                    <label
                      key={tag}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <Checkbox
                        checked={selectedTags.includes(tag)}
                        onCheckedChange={() => toggleTag(tag)}
                      />
                      <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                        {tag}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {selectedTags.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTags([])}
                  className="mt-4 w-full"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </aside>

          {/* Results Grid */}
          <div className="flex-1">
            {filteredGarages.length > 0 ? (
              <div className={cn(
                "grid gap-6",
                viewMode === "grid"
                  ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                  : "grid-cols-1"
              )}>
                {filteredGarages.map((garage, index) => (
                  <div
                    key={garage.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <GarageCard {...garage} />
                  </div>
                ))}
              </div>
            ) : (
              /* No Results - Add Garage CTA */
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-6 bg-secondary rounded-full flex items-center justify-center">
                  <MapPin className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  No garages found for "{query}"
                </h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  We couldn't find any garages matching your search. Would you like to add this garage to our platform?
                </p>
                <Link to={`/list-garage?name=${encodeURIComponent(query)}`}>
                  <Button size="lg" className="gap-2">
                    <PlusCircle className="w-5 h-5" />
                    Add This Garage
                  </Button>
                </Link>
              </div>
            )}

            {/* Load More */}
            {filteredGarages.length > 0 && (
              <div className="mt-12 text-center">
                <Button variant="outline" size="lg">
                  Load More Garages
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SearchResults;