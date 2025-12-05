import { useState } from "react";
import { Search, MapPin, Building2, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  variant?: "hero" | "compact";
  className?: string;
}

const countries = [
  { value: "in", label: "India" },
  { value: "us", label: "United States" },
  { value: "uk", label: "United Kingdom" },
  { value: "de", label: "Germany" },
  { value: "ae", label: "UAE" },
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
  us: [
    { value: "new-york", label: "New York" },
    { value: "los-angeles", label: "Los Angeles" },
    { value: "chicago", label: "Chicago" },
  ],
  uk: [
    { value: "london", label: "London" },
    { value: "manchester", label: "Manchester" },
    { value: "birmingham", label: "Birmingham" },
  ],
  de: [
    { value: "berlin", label: "Berlin" },
    { value: "munich", label: "Munich" },
    { value: "frankfurt", label: "Frankfurt" },
  ],
  ae: [
    { value: "dubai", label: "Dubai" },
    { value: "abu-dhabi", label: "Abu Dhabi" },
    { value: "sharjah", label: "Sharjah" },
  ],
};

export function SearchBar({ variant = "hero", className }: SearchBarProps) {
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [garageName, setGarageName] = useState("");
  const navigate = useNavigate();

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (country) params.set("country", country);
    if (city) params.set("city", city);
    if (garageName) params.set("q", garageName);
    navigate(`/search?${params.toString()}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-2 bg-card rounded-full px-4 py-2 shadow-md border border-border", className)}>
        <Search className="w-5 h-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search garages..."
          value={garageName}
          onChange={(e) => setGarageName(e.target.value)}
          onKeyDown={handleKeyDown}
          className="border-0 bg-transparent focus-visible:ring-0 px-0"
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
          
          <div className="relative">
            <div className="flex items-center h-14 px-4 rounded-xl bg-secondary/50">
              <Search className="w-5 h-5 text-primary mr-3" />
              <Input
                type="text"
                placeholder="Garage name..."
                value={garageName}
                onChange={(e) => setGarageName(e.target.value)}
                onKeyDown={handleKeyDown}
                className="border-0 bg-transparent focus-visible:ring-0 h-full px-0 text-base"
              />
            </div>
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
