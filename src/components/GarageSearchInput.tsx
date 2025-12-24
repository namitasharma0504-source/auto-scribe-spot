import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Building2, Loader2, MapPin, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Garage {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  country: string | null;
  address: string | null;
}

interface GarageSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onGarageSelect?: (garage: Garage) => void;
  placeholder?: string;
  className?: string;
}

export function GarageSearchInput({
  value,
  onChange,
  onGarageSelect,
  placeholder = "Search for a garage...",
  className,
}: GarageSearchInputProps) {
  const [suggestions, setSuggestions] = useState<Garage[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [selectedGarage, setSelectedGarage] = useState<Garage | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Fetch suggestions
  useEffect(() => {
    const searchGarages = async () => {
      if (value.length < 2) {
        setSuggestions([]);
        return;
      }

      // Don't search if we just selected this value
      if (selectedGarage && selectedGarage.name === value) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const escapedQuery = escapeIlikePattern(value);

        const { data: garages } = await supabase
          .from("garages")
          .select("id, name, city, state, country, address")
          .or(`name.ilike.%${escapedQuery}%,address.ilike.%${escapedQuery}%,city.ilike.%${escapedQuery}%`)
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

    const debounce = setTimeout(searchGarages, 200);
    return () => clearTimeout(debounce);
  }, [value, escapeIlikePattern, selectedGarage]);

  const handleSelect = useCallback((garage: Garage) => {
    setSelectedGarage(garage);
    onChange(garage.name);
    onGarageSelect?.(garage);
    setIsOpen(false);
    setSuggestions([]);
    setHighlightedIndex(-1);
  }, [onChange, onGarageSelect]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setSelectedGarage(null); // Clear selection when typing
    if (newValue.length >= 2) {
      setIsOpen(true);
    }
  };

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

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
        }
        break;
      case "Escape":
        setIsOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  }, [isOpen, suggestions, highlightedIndex, handleSelect]);

  const formatLocation = (garage: Garage) => {
    const parts = [garage.city, garage.state, garage.country].filter(Boolean);
    return parts.join(", ");
  };

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          onFocus={() => {
            if (value.length >= 2 && !selectedGarage) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          className={cn(
            "pl-10 pr-10",
            selectedGarage && "border-primary/50 bg-primary/5"
          )}
          aria-label="Search garages"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          autoComplete="off"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
        )}
        {selectedGarage && !isLoading && (
          <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
        )}
      </div>

      {/* Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl z-[100] overflow-hidden"
          role="listbox"
        >
          <ul className="py-1 max-h-64 overflow-y-auto">
            {suggestions.map((garage, idx) => (
              <li key={garage.id}>
                <button
                  onClick={() => handleSelect(garage)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={cn(
                    "w-full px-4 py-3 flex items-start gap-3 transition-colors text-left",
                    highlightedIndex === idx
                      ? "bg-primary/10"
                      : "hover:bg-secondary/50"
                  )}
                  role="option"
                  aria-selected={highlightedIndex === idx}
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Building2 className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {garage.name}
                    </p>
                    {formatLocation(garage) && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        {formatLocation(garage)}
                      </p>
                    )}
                    {garage.address && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {garage.address}
                      </p>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>

          {/* Footer hint */}
          <div className="px-4 py-2 border-t border-border bg-muted/30">
            <p className="text-xs text-muted-foreground">
              Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">↵</kbd> to select or <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">↑↓</kbd> to navigate
            </p>
          </div>
        </div>
      )}

      {/* No results message */}
      {isOpen && value.length >= 2 && suggestions.length === 0 && !isLoading && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl z-[100] p-4">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Search className="w-4 h-4" />
            <div>
              <p className="text-sm">No garages found for "{value}"</p>
              <p className="text-xs mt-1">You can still enter the name manually</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
