import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { SlidersHorizontal, Grid3X3, List, MapPin, PlusCircle, Loader2 } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { GarageCard } from "@/components/GarageCard";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

  const city = searchParams.get("city") || "";
  const query = searchParams.get("q") || "";

  // Fetch garages from database
  const { data: garages = [], isLoading } = useQuery({
    queryKey: ['search-garages', city, query, sortBy],
    queryFn: async () => {
      let queryBuilder = supabase
        .from('garages')
        .select('*');
      
      // Filter by city if provided
      if (city) {
        queryBuilder = queryBuilder.ilike('city', `%${city}%`);
      }
      
      // Filter by search query (name)
      if (query) {
        queryBuilder = queryBuilder.ilike('name', `%${query}%`);
      }
      
      // Apply sorting
      if (sortBy === 'rating') {
        queryBuilder = queryBuilder.order('rating', { ascending: false });
      } else if (sortBy === 'reviews') {
        queryBuilder = queryBuilder.order('review_count', { ascending: false });
      } else if (sortBy === 'name') {
        queryBuilder = queryBuilder.order('name', { ascending: true });
      }
      
      const { data: garagesData, error } = await queryBuilder;
      
      if (error) throw error;
      if (!garagesData || garagesData.length === 0) return [];
      
      // Fetch photos for all garages
      const garageIds = garagesData.map(g => g.id);
      const { data: photos } = await supabase
        .from('garage_photos')
        .select('garage_id, photo_url, display_order')
        .in('garage_id', garageIds)
        .order('display_order', { ascending: true });
      
      // Create a map of garage_id to array of photo URLs
      const photoMap = new Map<string, string[]>();
      photos?.forEach(photo => {
        const existing = photoMap.get(photo.garage_id) || [];
        existing.push(photo.photo_url);
        photoMap.set(photo.garage_id, existing);
      });
      
      return garagesData.map(garage => {
        const garagePhotos = photoMap.get(garage.id) || [];
        return {
          id: garage.id,
          name: garage.name,
          location: garage.city ? `${garage.city}, ${garage.country || 'India'}` : garage.country || 'India',
          address: garage.address || undefined,
          rating: garage.rating || 5,
          reviewCount: garage.review_count || 0,
          tags: garage.services || [],
          imageUrl: garagePhotos[0] || garage.photo_url || undefined,
          photos: garagePhotos.length > 0 ? garagePhotos : (garage.photo_url ? [garage.photo_url] : []),
          locationLink: garage.location_link || undefined,
          isVerified: garage.is_verified || false,
          isCertified: garage.is_certified || false,
          isRecommended: garage.is_recommended || false,
          hasDiscounts: garage.has_discounts || false,
          responseTime: garage.response_time || undefined,
          quotesThisMonth: Math.floor(Math.random() * 200) + 50,
          walkInWelcome: garage.walk_in_welcome || false,
        };
      });
    },
  });

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const displayLocation = city || "All Locations";

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
            {query ? `"${query}" in ${displayLocation}` : `Garages in ${displayLocation}`}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isLoading ? "Searching..." : `${garages.length} garages found`}
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
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : garages.length > 0 ? (
              <div className={cn(
                "grid gap-6",
                viewMode === "grid"
                  ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                  : "grid-cols-1"
              )}>
                {garages.map((garage, index) => (
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
                  No garages found {query ? `for "${query}"` : "in this location"}
                </h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  We couldn't find any garages matching your search. Would you like to add this garage to our platform?
                </p>
                <Link to={`/list-garage${query ? `?name=${encodeURIComponent(query)}` : ''}`}>
                  <Button size="lg" className="gap-2">
                    <PlusCircle className="w-5 h-5" />
                    Add This Garage
                  </Button>
                </Link>
              </div>
            )}

            {/* Load More */}
            {garages.length > 0 && (
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