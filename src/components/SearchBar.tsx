import { useState, useEffect, useRef, useCallback } from "react";
import { Search, MapPin, Building2, Loader2, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { indiaStates } from "@/data/indiaLocations";

interface SearchBarProps {
  variant?: "hero" | "compact";
  className?: string;
}

interface GarageSuggestion {
  id: string;
  name: string;
  city: string | null;
  country: string | null;
}

const countries = [
  { value: "in", label: "India" },
  { value: "ae", label: "UAE" },
];

// UAE Emirates
const uaeEmirates = [
  { value: "dubai", label: "Dubai" },
  { value: "abu-dhabi", label: "Abu Dhabi" },
  { value: "sharjah", label: "Sharjah" },
  { value: "ajman", label: "Ajman" },
  { value: "ras-al-khaimah", label: "Ras Al Khaimah" },
  { value: "fujairah", label: "Fujairah" },
  { value: "umm-al-quwain", label: "Umm Al Quwain" },
];

// Get states/regions based on country
const getRegions = (countryCode: string) => {
  if (countryCode === "in") {
    return indiaStates;
  }
  if (countryCode === "ae") {
    return uaeEmirates;
  }
  return [];
};

const RECENT_SEARCHES_KEY = "merigarage_recent_searches";
const MAX_RECENT_SEARCHES = 3;

interface RecentSearch {
  query: string;
  country?: string;
  city?: string;
  timestamp: number;
}

export function SearchBar({ variant = "hero", className }: SearchBarProps) {
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [garageName, setGarageName] = useState("");
  const [suggestions, setSuggestions] = useState<GarageSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Error loading recent searches:", e);
    }
  }, []);

  const saveRecentSearch = useCallback((search: RecentSearch) => {
    setRecentSearches((prev) => {
      // Remove duplicates and add new search at the beginning
      const filtered = prev.filter(
        (s) => s.query.toLowerCase() !== search.query.toLowerCase()
      );
      const updated = [search, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Escape special ILIKE characters
  const escapeIlikePattern = useCallback((input: string): string => {
    return input.replace(/[%_\\]/g, (char) => `\\${char}`);
  }, []);

  // Fetch garage suggestions
  useEffect(() => {
    const searchGarages = async () => {
      if (garageName.length < 2) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const escapedQuery = escapeIlikePattern(garageName);
        
        const { data: garages } = await supabase
          .from("garages")
          .select("id, name, city, country")
          .ilike("name", `%${escapedQuery}%`)
          .order("rating", { ascending: false })
          .limit(8);

        setSuggestions(garages || []);
      } catch (error) {
        console.error("Search error:", error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(searchGarages, 150);
    return () => clearTimeout(debounce);
  }, [garageName, escapeIlikePattern]);

  const handleSearch = (searchQuery?: string, searchCountry?: string, searchCity?: string) => {
    const q = searchQuery ?? garageName;
    const c = searchCountry ?? country;
    const ct = searchCity ?? city;
    
    // Save to recent searches if there's a query
    if (q.trim()) {
      saveRecentSearch({
        query: q,
        country: c || undefined,
        city: ct || undefined,
        timestamp: Date.now(),
      });
    }
    
    const params = new URLSearchParams();
    if (c) params.set("country", c);
    if (ct) params.set("city", ct);
    if (q) params.set("q", q);
    navigate(`/search?${params.toString()}`);
  };

  const handleRecentSearchClick = (search: RecentSearch) => {
    handleSearch(search.query, search.country, search.city);
  };

  const handleSelectGarage = (garage: GarageSuggestion) => {
    navigate(`/garage/${garage.id}`);
    setIsOpen(false);
    setGarageName("");
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
        e.preventDefault();
        handleSelectGarage(suggestions[highlightedIndex]);
      } else {
        handleSearch();
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => 
        prev < suggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => 
        prev > 0 ? prev - 1 : suggestions.length - 1
      );
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-2 bg-card rounded-full px-4 py-2 shadow-md border border-border", className)}>
        <Search className="w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search garages..."
          value={garageName}
          onChange={(e) => setGarageName(e.target.value)}
          onKeyDown={handleKeyDown}
          className="border-0 bg-transparent focus:outline-none px-0 flex-1"
        />
        <Button onClick={() => handleSearch()} size="sm" className="rounded-full">
          Search
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("w-full max-w-5xl mx-auto", className)}>
      <div className="bg-card rounded-2xl shadow-xl p-2 md:p-3 border border-border">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_2fr_auto] gap-2">
          <div className="relative">
            <Select value={country} onValueChange={(v) => { setCountry(v); setCity(""); }}>
              <SelectTrigger className="h-12 md:h-14 rounded-xl border-0 bg-secondary/50 hover:bg-secondary transition-colors touch-manipulation">
                <div className="flex items-center gap-2 md:gap-3">
                  <MapPin className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  <SelectValue placeholder="Country" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {countries.map((c) => (
                  <SelectItem key={c.value} value={c.value} className="py-3">
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="relative">
            <Select value={city} onValueChange={setCity} disabled={!country}>
              <SelectTrigger className="h-12 md:h-14 rounded-xl border-0 bg-secondary/50 hover:bg-secondary transition-colors touch-manipulation">
                <div className="flex items-center gap-2 md:gap-3">
                  <Building2 className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  <SelectValue placeholder={country === "in" ? "State" : "Emirate"} />
                </div>
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {country && getRegions(country).map((region) => (
                  <SelectItem key={region.value} value={region.value} className="py-3">
                    {region.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Garage Name with Autosuggest */}
          <div className="relative" ref={wrapperRef}>
            <div className="flex items-center h-12 md:h-14 px-3 md:px-4 rounded-xl bg-secondary/50">
              <Search className="w-4 h-4 md:w-5 md:h-5 text-primary mr-2 md:mr-3 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Garage name..."
                value={garageName}
                onChange={(e) => {
                  setGarageName(e.target.value);
                  setHighlightedIndex(-1);
                  setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                onKeyDown={handleKeyDown}
                className="border-0 bg-transparent focus:outline-none h-full px-0 text-base flex-1 min-w-0"
                autoComplete="off"
              />
              {isLoading && (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground flex-shrink-0" />
              )}
            </div>
            
            {/* Autosuggest Dropdown */}
            {isOpen && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl z-[100] overflow-hidden">
                <ul className="py-1 max-h-64 overflow-y-auto">
                  {suggestions.map((garage, idx) => (
                    <li key={garage.id}>
                      <button
                        onClick={() => handleSelectGarage(garage)}
                        onMouseEnter={() => setHighlightedIndex(idx)}
                        className={cn(
                          "w-full px-4 py-3 md:py-3.5 flex items-center gap-3 transition-colors text-left touch-manipulation min-h-[48px]",
                          highlightedIndex === idx 
                            ? "bg-primary/10" 
                            : "hover:bg-secondary/50"
                        )}
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">
                            {garage.name}
                          </p>
                          {(garage.city || garage.country) && (
                            <p className="text-xs text-muted-foreground truncate">
                              {[garage.city, garage.country].filter(Boolean).join(", ")}
                            </p>
                          )}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="px-4 py-2 border-t border-border bg-muted/30 hidden md:block">
                  <p className="text-xs text-muted-foreground">
                    Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">↵</kbd> to search
                  </p>
                </div>
              </div>
            )}
          </div>
          
          <Button
            onClick={() => handleSearch()}
            className="h-12 md:h-14 rounded-xl text-base md:text-lg font-semibold shadow-glow hover:shadow-xl transition-all duration-300 touch-manipulation min-h-[48px]"
          >
            <Search className="w-4 h-4 md:w-5 md:h-5 mr-2" />
            Search
          </Button>
        </div>
      </div>
      
      {/* Recent Searches */}
      {variant === "hero" && recentSearches.length > 0 && (
        <div className="mt-3 flex items-center justify-center gap-2 flex-wrap animate-fade-in">
          <span className="text-xs text-primary-foreground/60 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Recent:
          </span>
          {recentSearches.map((search, idx) => (
            <button
              key={`${search.query}-${idx}`}
              onClick={() => handleRecentSearchClick(search)}
              className="px-3 py-1.5 text-xs bg-background/20 hover:bg-background/30 text-primary-foreground rounded-full transition-colors backdrop-blur-sm border border-primary-foreground/10"
            >
              {search.query}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}