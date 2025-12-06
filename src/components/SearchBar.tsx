import { useState, useEffect, useRef, useCallback } from "react";
import { Search, MapPin, Building2, Loader2 } from "lucide-react";
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
  { value: "ng", label: "Nigeria" },
  { value: "eg", label: "Egypt" },
  { value: "qa", label: "Qatar" },
  { value: "sd", label: "Sudan" },
];

const cities: Record<string, { value: string; label: string }[]> = {
  in: [
    { value: "mumbai", label: "Mumbai" },
    { value: "delhi", label: "Delhi" },
    { value: "bangalore", label: "Bangalore" },
    { value: "chennai", label: "Chennai" },
    { value: "hyderabad", label: "Hyderabad" },
    { value: "pune", label: "Pune" },
    { value: "kolkata", label: "Kolkata" },
    { value: "ahmedabad", label: "Ahmedabad" },
    { value: "jaipur", label: "Jaipur" },
    { value: "lucknow", label: "Lucknow" },
  ],
  ae: [
    { value: "dubai", label: "Dubai" },
    { value: "abu-dhabi", label: "Abu Dhabi" },
    { value: "sharjah", label: "Sharjah" },
    { value: "ajman", label: "Ajman" },
    { value: "ras-al-khaimah", label: "Ras Al Khaimah" },
  ],
  ng: [
    { value: "lagos", label: "Lagos" },
    { value: "abuja", label: "Abuja" },
    { value: "port-harcourt", label: "Port Harcourt" },
    { value: "kano", label: "Kano" },
    { value: "ibadan", label: "Ibadan" },
  ],
  eg: [
    { value: "cairo", label: "Cairo" },
    { value: "alexandria", label: "Alexandria" },
    { value: "giza", label: "Giza" },
    { value: "sharm-el-sheikh", label: "Sharm El Sheikh" },
    { value: "luxor", label: "Luxor" },
  ],
  qa: [
    { value: "doha", label: "Doha" },
    { value: "al-wakrah", label: "Al Wakrah" },
    { value: "al-khor", label: "Al Khor" },
    { value: "lusail", label: "Lusail" },
  ],
  sd: [
    { value: "khartoum", label: "Khartoum" },
    { value: "omdurman", label: "Omdurman" },
    { value: "port-sudan", label: "Port Sudan" },
    { value: "kassala", label: "Kassala" },
  ],
};

export function SearchBar({ variant = "hero", className }: SearchBarProps) {
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [garageName, setGarageName] = useState("");
  const [suggestions, setSuggestions] = useState<GarageSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

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

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (country) params.set("country", country);
    if (city) params.set("city", city);
    if (garageName) params.set("q", garageName);
    navigate(`/search?${params.toString()}`);
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
        <Button onClick={handleSearch} size="sm" className="rounded-full">
          Search
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("w-full max-w-4xl mx-auto", className)}>
      <div className="bg-card rounded-2xl shadow-xl p-2 border border-border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <div className="relative">
            <Select value={country} onValueChange={(v) => { setCountry(v); setCity(""); }}>
              <SelectTrigger className="h-14 rounded-xl border-0 bg-secondary/50 hover:bg-secondary transition-colors">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-primary" />
                  <SelectValue placeholder="Country" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {countries.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="relative">
            <Select value={city} onValueChange={setCity} disabled={!country}>
              <SelectTrigger className="h-14 rounded-xl border-0 bg-secondary/50 hover:bg-secondary transition-colors">
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-primary" />
                  <SelectValue placeholder="City" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {country && cities[country]?.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Garage Name with Autosuggest */}
          <div className="relative" ref={wrapperRef}>
            <div className="flex items-center h-14 px-4 rounded-xl bg-secondary/50">
              <Search className="w-5 h-5 text-primary mr-3 flex-shrink-0" />
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
                          "w-full px-4 py-3 flex items-center gap-3 transition-colors text-left",
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
                <div className="px-4 py-2 border-t border-border bg-muted/30">
                  <p className="text-xs text-muted-foreground">
                    Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">↵</kbd> to search
                  </p>
                </div>
              </div>
            )}
          </div>
          
          <Button
            onClick={handleSearch}
            className="h-14 rounded-xl text-lg font-semibold shadow-glow hover:shadow-xl transition-all duration-300"
          >
            <Search className="w-5 h-5 mr-2" />
            Search
          </Button>
        </div>
      </div>
    </div>
  );
}