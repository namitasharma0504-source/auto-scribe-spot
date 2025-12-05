import { useState, useEffect, useRef } from "react";
import { Search, MapPin, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Suggestion {
  type: "garage" | "city";
  name: string;
  subtitle?: string;
  id?: string;
}

const popularCities = [
  { name: "Mumbai", country: "India" },
  { name: "Delhi", country: "India" },
  { name: "Dubai", country: "UAE" },
  { name: "Lagos", country: "Nigeria" },
  { name: "Cairo", country: "Egypt" },
  { name: "Doha", country: "Qatar" },
  { name: "Khartoum", country: "Sudan" },
];

export function SmartSearch({ className }: { className?: string }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const searchGarages = async () => {
      if (query.length < 2) {
        // Show popular cities when no query
        setSuggestions(
          popularCities.map((city) => ({
            type: "city" as const,
            name: city.name,
            subtitle: city.country,
          }))
        );
        return;
      }

      setIsLoading(true);
      try {
        // Search garages
        const { data: garages } = await supabase
          .from("garages")
          .select("id, name, city, country")
          .or(`name.ilike.%${query}%,city.ilike.%${query}%`)
          .limit(5);

        const garageSuggestions: Suggestion[] = (garages || []).map((g) => ({
          type: "garage" as const,
          name: g.name,
          subtitle: `${g.city}, ${g.country}`,
          id: g.id,
        }));

        // Filter cities
        const citySuggestions: Suggestion[] = popularCities
          .filter(
            (c) =>
              c.name.toLowerCase().includes(query.toLowerCase()) ||
              c.country.toLowerCase().includes(query.toLowerCase())
          )
          .map((c) => ({
            type: "city" as const,
            name: c.name,
            subtitle: c.country,
          }));

        setSuggestions([...garageSuggestions, ...citySuggestions].slice(0, 8));
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(searchGarages, 200);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleSelect = (suggestion: Suggestion) => {
    if (suggestion.type === "garage" && suggestion.id) {
      navigate(`/garage/${suggestion.id}`);
    } else if (suggestion.type === "city") {
      navigate(`/search?city=${suggestion.name.toLowerCase()}`);
    }
    setIsOpen(false);
    setQuery("");
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search garages, cities..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-4 h-10 bg-background border-border"
        />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              Searching...
            </div>
          ) : suggestions.length > 0 ? (
            <ul className="py-2">
              {suggestions.map((suggestion, idx) => (
                <li key={idx}>
                  <button
                    onClick={() => handleSelect(suggestion)}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-secondary/50 transition-colors text-left"
                  >
                    {suggestion.type === "garage" ? (
                      <Building2 className="w-4 h-4 text-primary flex-shrink-0" />
                    ) : (
                      <MapPin className="w-4 h-4 text-accent flex-shrink-0" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {suggestion.name}
                      </p>
                      {suggestion.subtitle && (
                        <p className="text-xs text-muted-foreground">
                          {suggestion.subtitle}
                        </p>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No results found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
