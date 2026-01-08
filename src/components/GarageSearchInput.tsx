import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Building2, Loader2, MapPin, CheckCircle2, Plus, Phone, Link as LinkIcon, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { indiaStates, indiaDistricts } from "@/data/indiaLocations";
import confetti from "canvas-confetti";

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
  onGarageAdded?: (garage: Garage) => void;
  placeholder?: string;
  className?: string;
  showAddOption?: boolean;
}

export function GarageSearchInput({
  value,
  onChange,
  onGarageSelect,
  onGarageAdded,
  placeholder = "Search for a garage...",
  className,
  showAddOption = true,
}: GarageSearchInputProps) {
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<Garage[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [selectedGarage, setSelectedGarage] = useState<Garage | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showSuccessPreview, setShowSuccessPreview] = useState(false);
  const [addedGarage, setAddedGarage] = useState<Garage | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  
  // Add garage form state
  const [newGarageName, setNewGarageName] = useState("");
  const [newGaragePhone, setNewGaragePhone] = useState("");
  const [newGarageAddress, setNewGarageAddress] = useState("");
  const [newGarageState, setNewGarageState] = useState("");
  const [newGarageCity, setNewGarageCity] = useState("");
  const [newGarageCustomCity, setNewGarageCustomCity] = useState("");
  const [newGarageLocationLink, setNewGarageLocationLink] = useState("");
  
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

  // Handle adding a new garage
  const handleAddGarage = async () => {
    if (!newGarageName.trim() || !newGarageState) {
      toast({
        title: "Missing Information",
        description: "Please enter the garage name and state.",
        variant: "destructive",
      });
      return;
    }

    setIsAdding(true);
    try {
      const stateLabel = indiaStates.find(s => s.value === newGarageState)?.label || newGarageState;
      const districtLabel = newGarageCity 
        ? indiaDistricts[newGarageState]?.find(d => d.value === newGarageCity)?.label || newGarageCity 
        : "";
      const cityName = newGarageCustomCity.trim() || districtLabel;

      const { data: newGarage, error } = await supabase
        .from("garages")
        .insert({
          name: newGarageName.trim(),
          phone: newGaragePhone.trim() || null,
          address: newGarageAddress.trim() || null,
          state: stateLabel,
          city: cityName || null,
          country: "India",
          location_link: newGarageLocationLink.trim() || null,
        })
        .select("id, name, city, state, country, address")
        .single();

      if (error) throw error;

      // Store the added garage for preview
      setAddedGarage(newGarage);
      
      // Reset form and show success preview
      setShowAddDialog(false);
      setShowSuccessPreview(true);
      
      // Trigger confetti celebration
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6'],
      });
      // Second burst for more impact
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#ef4444', '#3b82f6', '#22c55e'],
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#f59e0b', '#8b5cf6', '#ec4899'],
        });
      }, 150);
      
      setNewGarageName("");
      setNewGaragePhone("");
      setNewGarageAddress("");
      setNewGarageState("");
      setNewGarageCity("");
      setNewGarageCustomCity("");
      setNewGarageLocationLink("");
    } catch (error: any) {
      console.error("Error adding garage:", error);
      toast({
        title: "Failed to Add Garage",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

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

      {/* No results message with Add Garage option */}
      {isOpen && value.length >= 2 && suggestions.length === 0 && !isLoading && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl z-[100] p-4">
          <div className="flex items-start gap-3 text-muted-foreground">
            <Search className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-foreground">No garages found for "{value}"</p>
              {showAddOption && (
                <div className="mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2 text-primary border-primary/30 hover:bg-primary/10"
                    onClick={() => {
                      setNewGarageName(value);
                      setShowAddDialog(true);
                      setIsOpen(false);
                    }}
                  >
                    <Plus className="w-4 h-4" />
                    Add "{value}" as a new garage
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Add this garage to our directory so you can review it
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Garage Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Add New Garage
            </DialogTitle>
            <DialogDescription>
              Add this garage to our directory. Fill in the details you know.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Garage Name */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Garage Name <span className="text-destructive">*</span>
              </label>
              <Input
                value={newGarageName}
                onChange={(e) => setNewGarageName(e.target.value)}
                placeholder="Enter garage name"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={newGaragePhone}
                  onChange={(e) => setNewGaragePhone(e.target.value)}
                  placeholder="e.g., +91 98765 43210"
                  className="pl-10"
                />
              </div>
            </div>

            {/* State */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                State <span className="text-destructive">*</span>
              </label>
              <Select value={newGarageState} onValueChange={(v) => { setNewGarageState(v); setNewGarageCity(""); setNewGarageCustomCity(""); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {indiaStates.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* City/District */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                City/District
              </label>
              <Select 
                value={newGarageCity} 
                onValueChange={setNewGarageCity}
                disabled={!newGarageState}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select city/district" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {newGarageState && indiaDistricts[newGarageState]?.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {newGarageState && (
                <div className="mt-2">
                  <Input
                    value={newGarageCustomCity}
                    onChange={(e) => setNewGarageCustomCity(e.target.value)}
                    placeholder="Or type city/village name if not listed"
                    className="text-sm"
                  />
                </div>
              )}
            </div>

            {/* Address */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Address
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  value={newGarageAddress}
                  onChange={(e) => setNewGarageAddress(e.target.value)}
                  placeholder="Street address"
                  className="pl-10"
                />
              </div>
            </div>

            {/* Location Link */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Google Maps Link
              </label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={newGarageLocationLink}
                  onChange={(e) => setNewGarageLocationLink(e.target.value)}
                  placeholder="https://maps.google.com/..."
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddGarage}
              disabled={isAdding || !newGarageName.trim() || !newGarageState}
            >
              {isAdding ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Garage
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Preview Dialog */}
      <Dialog open={showSuccessPreview} onOpenChange={setShowSuccessPreview}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <CheckCircle2 className="w-5 h-5" />
              Garage Added Successfully!
            </DialogTitle>
            <DialogDescription>
              Great! This garage has been added to our directory.
            </DialogDescription>
          </DialogHeader>
          
          {addedGarage && (
            <div className="py-4">
              {/* Garage Preview Card */}
              <div className="bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 rounded-xl p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-lg">
                      {addedGarage.name}
                    </h3>
                    {(addedGarage.city || addedGarage.state || addedGarage.country) && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        {[addedGarage.city, addedGarage.state, addedGarage.country].filter(Boolean).join(", ")}
                      </p>
                    )}
                    {addedGarage.address && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {addedGarage.address}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 text-green-600 text-xs font-medium">
                    <CheckCircle2 className="w-3 h-3" />
                    New Listing
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Ready for your review
                  </span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground text-center mt-4">
                Click below to continue writing your review for this garage.
              </p>
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowSuccessPreview(false);
                setAddedGarage(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (addedGarage) {
                  onChange(addedGarage.name);
                  setSelectedGarage(addedGarage);
                  onGarageSelect?.(addedGarage);
                  onGarageAdded?.(addedGarage);
                  toast({
                    title: "Garage Selected",
                    description: "You can now complete your review.",
                  });
                }
                setShowSuccessPreview(false);
                setAddedGarage(null);
              }}
              className="gap-2"
            >
              Continue to Review
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
