import { useState, useEffect, useRef, useCallback } from "react";
import { Search, MapPin, Building2, Loader2, TrendingUp, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Suggestion {
  type: "garage" | "city" | "recent";
  name: string;
  subtitle?: string;
  id?: string;
}

const popularCities = [
  { name: "Mumbai", country: "India" },
  { name: "Delhi", country: "India" },
  { name: "Bangalore", country: "India" },
  { name: "Chennai", country: "India" },
  { name: "Dubai", country: "UAE" },
  { name: "Lagos", country: "Nigeria" },
  { name: "Cairo", country: "Egypt" },
  { name: "Doha", country: "Qatar" },
  { name: "Khartoum", country: "Sudan" },
];

interface SmartSearchProps {
  className?: string;
  variant?: "default" | "hero";
  placeholder?: string;
}

export function SmartSearch({ 
  className, 
  variant = "default",
  placeholder = "Search garages, cities..." 
}: SmartSearchProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
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

  // Escape special ILIKE characters to prevent SQL injection
  const escapeIlikePattern = useCallback((input: string): string => {
    return input.replace(/[%_\\]/g, (char) => `\\${char}`);
  }, []);

  // Fetch suggestions
  useEffect(() => {
    const searchGarages = async () => {
      if (query.length < 1) {
        // Show popular cities when no query
        setSuggestions(
          popularCities.slice(0, 6).map((city) => ({
            type: "city" as const,
            name: city.name,
            subtitle: city.country,
          }))
        );
        return;
      }

      setIsLoading(true);
      try {
        const escapedQuery = escapeIlikePattern(query);
        
        // Search garages from database
        const { data: garages } = await supabase
          .from("garages")
          .select("id, name, city, country, rating")
          .or(`name.ilike.%${escapedQuery}%,city.ilike.%${escapedQuery}%,address.ilike.%${escapedQuery}%`)
          .order("rating", { ascending: false })
          .limit(5);

        const garageSuggestions: Suggestion[] = (garages || []).map((g) => ({
          type: "garage" as const,
          name: g.name,
          subtitle: `${g.city || ""}, ${g.country || ""}`.replace(/^, |, $/g, ""),
          id: g.id,
        }));

        // Filter cities based on query
        const citySuggestions: Suggestion[] = popularCities
          .filter(
            (c) =>
              c.name.toLowerCase().includes(query.toLowerCase()) ||
              c.country.toLowerCase().includes(query.toLowerCase())
          )
          .slice(0, 3)
          .map((c) => ({
            type: "city" as const,
            name: c.name,
            subtitle: c.country,
          }));

        // Combine and limit results
        const combined = [...garageSuggestions, ...citySuggestions];
        setSuggestions(combined.slice(0, 8));
      } catch (error) {
        console.error("Search error:", error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(searchGarages, 150);
    return () => clearTimeout(debounce);
  }, [query, escapeIlikePattern]);

  const handleSelect = useCallback((suggestion: Suggestion) => {
    if (suggestion.type === "garage" && suggestion.id) {
      navigate(`/garage/${suggestion.id}`);
    } else if (suggestion.type === "city") {
      navigate(`/search?city=${encodeURIComponent(suggestion.name.toLowerCase())}`);
    }
    setIsOpen(false);
    setQuery("");
    setHighlightedIndex(-1);
  }, [navigate]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
          handleSelect(suggestions[highlightedIndex]);
        } else if (query.trim()) {
          navigate(`/search?q=${encodeURIComponent(query.trim())}`);
          setIsOpen(false);
          setQuery("");
        }
        break;
      case "Escape":
        setIsOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  }, [isOpen, suggestions, highlightedIndex, handleSelect, navigate, query]);

  const inputClasses = variant === "hero" 
    ? "pl-12 pr-4 h-14 text-lg bg-card border-border shadow-lg rounded-xl"
    : "pl-10 pr-4 h-10 bg-background border-border rounded-lg";

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className={cn(
          "absolute top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none",
          variant === "hero" ? "left-4 w-5 h-5" : "left-3 w-4 h-4"
        )} />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setHighlightedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className={inputClasses}
          aria-label="Search garages and cities"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          autoComplete="off"
        />
        {isLoading && (
          <Loader2 className={cn(
            "absolute top-1/2 -translate-y-1/2 animate-spin text-muted-foreground",
            variant === "hero" ? "right-4 w-5 h-5" : "right-3 w-4 h-4"
          )} />
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div 
          className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl z-[100] overflow-hidden"
          role="listbox"
        >
          {/* Header when showing popular cities */}
          {query.length < 1 && (
            <div className="px-4 py-2 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                <TrendingUp className="w-3 h-3" />
                Popular Cities
              </div>
            </div>
          )}

          {suggestions.length > 0 ? (
            <ul className="py-1 max-h-80 overflow-y-auto">
              {suggestions.map((suggestion, idx) => (
                <li key={`${suggestion.type}-${suggestion.name}-${idx}`}>
                  <button
                    onClick={() => handleSelect(suggestion)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={cn(
                      "w-full px-4 py-3 flex items-center gap-3 transition-colors text-left",
                      highlightedIndex === idx 
                        ? "bg-primary/10" 
                        : "hover:bg-secondary/50"
                    )}
                    role="option"
                    aria-selected={highlightedIndex === idx}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                      suggestion.type === "garage" 
                        ? "bg-primary/10" 
                        : "bg-accent/10"
                    )}>
                      {suggestion.type === "garage" ? (
                        <Building2 className="w-4 h-4 text-primary" />
                      ) : suggestion.type === "recent" ? (
                        <Clock className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <MapPin className="w-4 h-4 text-accent" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {suggestion.name}
                      </p>
                      {suggestion.subtitle && (
                        <p className="text-xs text-muted-foreground truncate">
                          {suggestion.subtitle}
                        </p>
                      )}
                    </div>
                    {suggestion.type === "garage" && (
                      <span className="text-xs text-muted-foreground">Garage</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          ) : !isLoading && query.length >= 1 ? (
            <div className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-muted rounded-full flex items-center justify-center">
                <Search className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                No results found for "{query}"
              </p>
              <button 
                onClick={() => {
                  navigate(`/search?q=${encodeURIComponent(query)}`);
                  setIsOpen(false);
                  setQuery("");
                }}
                className="text-sm text-primary hover:underline font-medium"
              >
                Search all garages →
              </button>
            </div>
          ) : null}

          {/* Footer hint */}
          {suggestions.length > 0 && (
            <div className="px-4 py-2 border-t border-border bg-muted/30">
              <p className="text-xs text-muted-foreground">
                Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">↵</kbd> to search or <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">↑↓</kbd> to navigate
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
