import { Link } from "react-router-dom";
import { TrendingUp, Award, MapPin, ArrowRight, Star, Gift } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SearchBar } from "@/components/SearchBar";
import { GarageCard } from "@/components/GarageCard";
import { HeroSlider } from "@/components/HeroSlider";
import { Button } from "@/components/ui/button";

const trendingCities = [
  { name: "Mumbai", country: "India", garageCount: 2450, slug: "mumbai" },
  { name: "Delhi", country: "India", garageCount: 2180, slug: "delhi" },
  { name: "Bangalore", country: "India", garageCount: 1890, slug: "bangalore" },
  { name: "Chennai", country: "India", garageCount: 1650, slug: "chennai" },
  { name: "Hyderabad", country: "India", garageCount: 1420, slug: "hyderabad" },
  { name: "Pune", country: "India", garageCount: 1280, slug: "pune" },
];

const topGarages = [
  {
    id: "1",
    name: "Mahindra First Choice",
    location: "Andheri, Mumbai",
    rating: 4.9,
    reviewCount: 542,
    tags: ["Multi-Brand", "Genuine Parts", "Warranty"],
    imageUrl: "https://images.unsplash.com/photo-1625047509248-ec889cbff17f?w=600&h=400&fit=crop",
  },
  {
    id: "2",
    name: "MyTVS Service Center",
    location: "Koramangala, Bangalore",
    rating: 4.8,
    reviewCount: 387,
    tags: ["Doorstep Service", "Transparent Pricing", "Expert Mechanics"],
    imageUrl: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600&h=400&fit=crop",
  },
  {
    id: "3",
    name: "GoMechanic Hub",
    location: "Connaught Place, Delhi",
    rating: 4.7,
    reviewCount: 298,
    tags: ["Same Day", "Affordable", "AC Specialist"],
    imageUrl: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=600&h=400&fit=crop",
  },
  {
    id: "4",
    name: "Pitstop Auto Care",
    location: "Banjara Hills, Hyderabad",
    rating: 4.8,
    reviewCount: 356,
    tags: ["Premium Service", "All Brands", "Digital Reports"],
    imageUrl: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&h=400&fit=crop",
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background Slider */}
        <HeroSlider />
        
        {/* Accent overlay */}
        <div className="absolute inset-0 opacity-20 z-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, hsl(var(--primary)) 0%, transparent 50%),
                              radial-gradient(circle at 75% 75%, hsl(var(--accent)) 0%, transparent 50%)`,
          }} />
        </div>
        
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary-foreground text-sm font-medium mb-6 animate-fade-in">
              <Award className="w-4 h-4" />
              Trusted by 50,000+ car owners
            </span>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-primary-foreground mb-6 leading-tight animate-fade-in" style={{ animationDelay: "0.1s" }}>
              Find the Best
              <span className="block text-primary">Car Service Garage</span>
              Near You
            </h1>
            
            <p className="text-xl md:text-2xl text-primary-foreground/80 mb-10 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              Read trusted reviews and discover top-rated mechanics in your area
            </p>
            
            <div className="animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
              <SearchBar />
            </div>
            
            <p className="mt-6 text-primary-foreground/60 text-sm animate-fade-in" style={{ animationDelay: "0.4s" }}>
              Popular: Oil Change • Brake Repair • Engine Diagnostics • Tire Service
            </p>
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-pulse">
          <div className="w-6 h-10 border-2 border-primary-foreground/30 rounded-full flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-primary-foreground/50 rounded-full" />
          </div>
        </div>
      </section>

      {/* Trust Banner */}
      <section className="py-16 bg-card border-b border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Garages */}
            <div className="text-center group">
              <div className="relative w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden ring-4 ring-primary/20 group-hover:ring-primary/40 transition-all">
                <img 
                  src="https://images.unsplash.com/photo-1625047509248-ec889cbff17f?w=200&h=200&fit=crop" 
                  alt="Professional garage" 
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-1">5,000+</h3>
              <p className="text-muted-foreground">Verified Garages</p>
              <p className="text-sm text-primary mt-2">Across India</p>
            </div>
            
            {/* Happy Customers */}
            <div className="text-center group">
              <div className="relative w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden ring-4 ring-accent/20 group-hover:ring-accent/40 transition-all">
                <img 
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&facepad=2" 
                  alt="Happy customer" 
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-1">50,000+</h3>
              <p className="text-muted-foreground">Happy Customers</p>
              <p className="text-sm text-accent mt-2">Trusted Reviews</p>
            </div>
            
            {/* Garage Owners */}
            <div className="text-center group">
              <div className="relative w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden ring-4 ring-primary/20 group-hover:ring-primary/40 transition-all">
                <img 
                  src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&facepad=2" 
                  alt="Garage owner" 
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-1">2,500+</h3>
              <p className="text-muted-foreground">Garage Partners</p>
              <p className="text-sm text-primary mt-2">Growing Network</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Cities */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <div>
              <div className="flex items-center gap-2 text-primary mb-2">
                <TrendingUp className="w-5 h-5" />
                <span className="font-semibold">Trending Now</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Popular Cities
              </h2>
            </div>
            <Link to="/search">
              <Button variant="ghost" className="gap-2 group">
                View All
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {trendingCities.map((city, index) => (
              <Link
                key={city.slug}
                to={`/search?city=${city.slug}`}
                className="group animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="bg-card rounded-2xl p-5 text-center shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-border group-hover:border-primary/30">
                  <div className="w-12 h-12 mx-auto mb-3 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">{city.name}</h3>
                  <p className="text-sm text-muted-foreground">{city.country}</p>
                  <p className="text-sm text-primary mt-2 font-medium">
                    {city.garageCount.toLocaleString()} garages
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Top Rated Garages */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <div>
              <div className="flex items-center gap-2 text-primary mb-2">
                <Award className="w-5 h-5" />
                <span className="font-semibold">Top Rated</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Featured Garages
              </h2>
            </div>
            <Link to="/search">
              <Button variant="ghost" className="gap-2 group">
                View All
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {topGarages.map((garage, index) => (
              <div
                key={garage.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <GarageCard {...garage} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Customer CTA Section */}
      <section className="py-20 bg-card border-y border-border">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
                <Gift className="w-4 h-4" />
                Earn Rewards
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Recently Visited a Garage?
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Share your experience and help others find great mechanics. Submit verified reviews and earn points redeemable for exclusive rewards!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Link to="/submit-review">
                  <Button size="lg" className="text-lg px-8 h-14 rounded-xl shadow-glow w-full sm:w-auto">
                    <Star className="w-5 h-5 mr-2" />
                    Submit a Review
                  </Button>
                </Link>
              </div>
            </div>
            <div className="bg-secondary/50 rounded-2xl p-6 md:p-8">
              <h3 className="font-semibold text-foreground mb-6">How it works</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0">1</div>
                  <div>
                    <h4 className="font-medium text-foreground">Add Garage Details</h4>
                    <p className="text-sm text-muted-foreground">Enter the garage name and location you visited</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0">2</div>
                  <div>
                    <h4 className="font-medium text-foreground">Rate & Review</h4>
                    <p className="text-sm text-muted-foreground">Share your honest experience with ratings and details</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0">3</div>
                  <div>
                    <h4 className="font-medium text-foreground">Earn Points</h4>
                    <p className="text-sm text-muted-foreground">Get 50 points per verified review - redeem for rewards!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Garage Owner CTA Section */}
      <section className="py-20 bg-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-background mb-4">
            Own a Garage?
          </h2>
          <p className="text-xl text-background/70 mb-8 max-w-2xl mx-auto">
            Join thousands of garages and start collecting reviews from your customers today.
          </p>
          <Button size="lg" className="text-lg px-8 h-14 rounded-xl">
            List Your Garage
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
