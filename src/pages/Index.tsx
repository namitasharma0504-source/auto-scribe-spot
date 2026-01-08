import { Link } from "react-router-dom";
import { lazy, Suspense, useState, useCallback } from "react";
import { Wrench, Award, ArrowRight, Star, Gift, Search, Loader2, CheckCircle, Zap, Car, Thermometer, Paintbrush, CircleDot, Activity, Plug, Layers, Crown, ThumbsUp, ShieldCheck, Clock } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SearchBar } from "@/components/SearchBar";
import { HeroSlider, heroSlides } from "@/components/HeroSlider";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CarCareTipsSection } from "@/components/home/CarCareTipsSection";
import indianGarageExterior from "@/assets/indian-garage-exterior.jpg";
import indianCustomer from "@/assets/indian-customer.jpg";
import indianGarageOwner from "@/assets/indian-garage-owner.jpg";

// Lazy load components below the fold
const GarageCard = lazy(() => import("@/components/GarageCard").then(m => ({ default: m.GarageCard })));

const serviceCategories = [
  { name: "General Service", icon: Wrench, slug: "general-service", color: "bg-blue-500/10 text-blue-600" },
  { name: "AC Repair", icon: Thermometer, slug: "ac-repair", color: "bg-cyan-500/10 text-cyan-600" },
  { name: "Body Work", icon: Paintbrush, slug: "body-work", color: "bg-orange-500/10 text-orange-600" },
  { name: "Tyres", icon: CircleDot, slug: "tyres", color: "bg-gray-500/10 text-gray-600" },
  { name: "Diagnostics", icon: Activity, slug: "diagnostics", color: "bg-purple-500/10 text-purple-600" },
  { name: "EV Services", icon: Plug, slug: "ev-friendly", color: "bg-green-500/10 text-green-600" },
  { name: "Multi-brand", icon: Layers, slug: "multi-brand", color: "bg-indigo-500/10 text-indigo-600" },
  { name: "Premium Cars", icon: Crown, slug: "premium-cars", color: "bg-amber-500/10 text-amber-600" },
];

const Index = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const handleSlideChange = useCallback((index: number) => setCurrentSlide(index), []);
  
  const { data: featuredGarages = [], isLoading } = useQuery({
    queryKey: ['featured-garages'],
    queryFn: async () => {
      // Fetch garages with their photos from garage_photos table (India only)
      const { data: garages, error: garagesError } = await supabase
        .from('garages')
        .select('*')
        .eq('country', 'India')
        .order('rating', { ascending: false })
        .limit(12);
      
      if (garagesError) throw garagesError;
      
      // Fetch photos for all garages
      const garageIds = garages.map(g => g.id);
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
      
      // Map garages with their photos
      const mappedGarages = garages.map(garage => {
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
          hasUploadedPhotos: garagePhotos.length > 0, // Track if garage has uploaded photos
        };
      });
      
      // Sort: garages with uploaded photos first, then by rating
      return mappedGarages.sort((a, b) => {
        if (a.hasUploadedPhotos && !b.hasUploadedPhotos) return -1;
        if (!a.hasUploadedPhotos && b.hasUploadedPhotos) return 1;
        return b.rating - a.rating;
      });
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section - Optimized for conversion */}
      <main>
        <section className="relative min-h-[85vh] md:min-h-[90vh] flex items-center justify-center overflow-hidden" aria-label="Search for garage reviews">
          {/* Background Slider */}
          <HeroSlider onSlideChange={handleSlideChange} />
          
          {/* Accent overlay */}
          <div className="absolute inset-0 opacity-20 z-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, hsl(var(--primary)) 0%, transparent 50%),
                                radial-gradient(circle at 75% 75%, hsl(var(--accent)) 0%, transparent 50%)`,
            }} />
          </div>
          
          <div className="container mx-auto px-4 py-12 md:py-20 relative z-10">
            <div className="text-center max-w-4xl mx-auto">
              {/* Social Proof Badge */}
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary-foreground text-sm font-medium mb-4 md:mb-6 animate-fade-in">
                <Star className="w-4 h-4 fill-current" />
                Rated 4.8/5 by 50,000+ car owners
              </span>
              
              <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-primary-foreground mb-4 md:mb-6 leading-tight transition-all duration-500" key={currentSlide}>
                {heroSlides[currentSlide].headline}
                <span className="block text-primary mt-2">{heroSlides[currentSlide].subline}</span>
              </h1>
              
              <p className="text-lg md:text-xl lg:text-2xl text-primary-foreground/90 mb-6 md:mb-8 animate-fade-in max-w-2xl mx-auto" style={{ animationDelay: "0.2s" }}>
                Read verified reviews, compare ratings, and book the best garage for your car
              </p>
            
              {/* Search Bar */}
              <div className="animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
                <SearchBar />
              </div>
              
              {/* Quick Action CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6 animate-fade-in" style={{ animationDelay: "0.4s" }}>
                <Link to="/submit-review">
                  <Button size="lg" variant="secondary" className="text-base px-6 h-12 rounded-xl w-full sm:w-auto min-w-[180px]">
                    <Star className="w-4 h-4 mr-2" />
                    Write a Review
                  </Button>
                </Link>
                <Link to="/list-garage">
                  <Button size="lg" variant="secondary" className="text-base px-6 h-12 rounded-xl w-full sm:w-auto min-w-[180px]">
                    <Award className="w-4 h-4 mr-2" />
                    List Your Garage
                  </Button>
                </Link>
              </div>
              
              {/* Quick Trust Indicators */}
              <div className="flex flex-wrap justify-center gap-4 md:gap-6 mt-6 md:mt-8 animate-fade-in" style={{ animationDelay: "0.5s" }}>
                <div className="flex items-center gap-2 text-primary-foreground/80 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Verified Reviews</span>
                </div>
                <Link to="/search" className="flex items-center gap-2 text-primary-foreground/80 text-sm hover:text-primary-foreground transition-colors cursor-pointer">
                  <Search className="w-4 h-4 text-blue-400" />
                  <span className="underline underline-offset-2">Browse 5,000+ Garages</span>
                </Link>
                <div className="flex items-center gap-2 text-primary-foreground/80 text-sm">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span>Instant Quotes</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Scroll Indicator - Hidden on mobile for cleaner look */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-pulse hidden md:block">
            <div className="w-6 h-10 border-2 border-primary-foreground/30 rounded-full flex justify-center pt-2">
              <div className="w-1.5 h-3 bg-primary-foreground/50 rounded-full" />
            </div>
          </div>
        </section>

      {/* Social Proof Banner - Compact & Impactful */}
      <section className="py-6 md:py-8 bg-card border-b border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-3 gap-4 md:gap-8">
            {/* Garages */}
            <div className="text-center group">
              <div className="relative w-16 h-16 md:w-20 md:h-20 mx-auto mb-2 md:mb-3 rounded-full overflow-hidden ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
                <img 
                  src={indianGarageExterior} 
                  alt="Auto repair garage in India" 
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-foreground">5,000+</h3>
              <p className="text-xs md:text-sm text-muted-foreground">Verified Garages</p>
            </div>
            
            {/* Happy Customers */}
            <div className="text-center group">
              <div className="relative w-16 h-16 md:w-20 md:h-20 mx-auto mb-2 md:mb-3 rounded-full overflow-hidden ring-2 ring-accent/20 group-hover:ring-accent/40 transition-all">
                <img 
                  src={indianCustomer} 
                  alt="Happy Indian customer" 
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-foreground">50,000+</h3>
              <p className="text-xs md:text-sm text-muted-foreground">Happy Customers</p>
            </div>
            
            {/* Garage Owners */}
            <div className="text-center group">
              <div className="relative w-16 h-16 md:w-20 md:h-20 mx-auto mb-2 md:mb-3 rounded-full overflow-hidden ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
                <img 
                  src={indianGarageOwner} 
                  alt="Indian garage owner" 
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-foreground">2,500+</h3>
              <p className="text-xs md:text-sm text-muted-foreground">Garage Partners</p>
            </div>
          </div>
        </div>
      </section>

      {/* Customer CTA Section - Recently Visited */}
      <section className="py-6 md:py-8 bg-card border-b border-border">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-6 items-center">
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium mb-3">
                <Gift className="w-4 h-4" />
                Earn Rewards
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                Recently Visited a Garage?
              </h2>
              <p className="text-base text-muted-foreground mb-4">
                Share your experience and help others find great mechanics. Submit verified reviews and earn points redeemable for exclusive rewards!
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                <Link to="/submit-review">
                  <Button size="lg" className="text-base px-6 h-12 rounded-xl shadow-glow w-full sm:w-auto">
                    <Star className="w-5 h-5 mr-2" />
                    Submit a Review
                  </Button>
                </Link>
              </div>
            </div>
            <div className="bg-secondary/50 rounded-2xl p-5 md:p-6">
              <h3 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wide">How it works</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs flex-shrink-0">1</div>
                  <div>
                    <h4 className="font-medium text-foreground text-sm">Add Garage Details</h4>
                    <p className="text-xs text-muted-foreground">Enter the garage name and location you visited</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs flex-shrink-0">2</div>
                  <div>
                    <h4 className="font-medium text-foreground text-sm">Rate & Review</h4>
                    <p className="text-xs text-muted-foreground">Share your honest experience with ratings and details</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs flex-shrink-0">3</div>
                  <div>
                    <h4 className="font-medium text-foreground text-sm">Earn Points</h4>
                    <p className="text-xs text-muted-foreground">Get 50 points per verified review - redeem for rewards!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Browse by Service */}
      <section className="py-6 md:py-8 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 text-primary mb-2">
                <Wrench className="w-5 h-5" />
                <span className="font-semibold">Find What You Need</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Browse by Service
              </h2>
            </div>
            <Link to="/search">
              <Button variant="ghost" className="gap-2 group">
                View All
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 md:gap-4">
            {serviceCategories.map((service, index) => {
              const IconComponent = service.icon;
              return (
                <Link
                  key={service.slug}
                  to={`/search?service=${service.slug}`}
                  className="group animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="bg-card rounded-xl p-4 text-center shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-border group-hover:border-primary/30">
                    <div className={`w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center ${service.color} group-hover:scale-110 transition-transform`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <h3 className="font-medium text-foreground text-sm">{service.name}</h3>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Top Rated Garages */}
      <section className="py-8 md:py-10 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
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
          
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : featuredGarages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No garages found. Add some garages to get started!</p>
            </div>
          ) : (
            <Suspense fallback={<div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {featuredGarages.map((garage, index) => (
                  <div
                    key={garage.id}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <GarageCard {...garage} />
                  </div>
                ))}
              </div>
            </Suspense>
          )}
        </div>
      </section>

      {/* How We Help You Choose - SEO Section */}
      <section className="py-8 md:py-10 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              How We Help You Choose the Right Garage for Your Car
            </h2>
            <p className="text-base text-muted-foreground max-w-3xl mx-auto">
              Finding a trustworthy car service center can be challenging. MeriGarage Reviews simplifies your search by providing verified reviews, transparent ratings, and detailed information about garages near you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border text-center">
              <div className="w-14 h-14 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                <Search className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Search Garages Near You</h3>
              <p className="text-sm text-muted-foreground">
                Easily find car repair shops, mechanics, and service centers in your city. Search by location, services, or garage name to discover the best options nearby.
              </p>
            </div>

            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border text-center">
              <div className="w-14 h-14 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                <Star className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Read Verified Reviews</h3>
              <p className="text-sm text-muted-foreground">
                Make informed decisions with authentic customer reviews. Our verified review system ensures genuine feedback from real car owners who visited the garage.
              </p>
            </div>

            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border text-center">
              <div className="w-14 h-14 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                <ThumbsUp className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Compare Ratings & Services</h3>
              <p className="text-sm text-muted-foreground">
                Compare multiple garages based on ratings, services offered, pricing transparency, and customer satisfaction to find the perfect match for your car's needs.
              </p>
            </div>

            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border text-center">
              <div className="w-14 h-14 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                <ShieldCheck className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Choose with Confidence</h3>
              <p className="text-sm text-muted-foreground">
                Select a garage you can trust. Our platform highlights certified mechanics, warranty offerings, and garages known for honest pricing and quality service.
              </p>
            </div>
          </div>

          <div className="bg-secondary/50 rounded-2xl p-6 md:p-8">
            <div className="grid md:grid-cols-2 gap-6 items-center">
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  Why Read Reviews Before Choosing a Garage?
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">
                      <strong className="text-foreground">Save Time:</strong> Avoid trial and error by choosing garages with proven track records and positive customer experiences.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">
                      <strong className="text-foreground">Avoid Scams:</strong> Identify trustworthy mechanics and avoid garages known for overcharging or poor quality work.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Star className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">
                      <strong className="text-foreground">Quality Service:</strong> Find garages that consistently deliver excellent service, use genuine parts, and stand behind their work.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <ThumbsUp className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">
                      <strong className="text-foreground">Fair Pricing:</strong> Discover garages known for transparent pricing without hidden charges or unnecessary upselling.
                    </span>
                  </li>
                </ul>
              </div>
              <div className="bg-card rounded-xl p-6 border border-border">
                <h4 className="font-semibold text-foreground mb-4">Popular Services Reviewed</h4>
                <div className="flex flex-wrap gap-2">
                  {["Oil Change", "Brake Repair", "Engine Service", "AC Repair", "Battery Replacement", "Wheel Alignment", "Car Wash", "Denting & Painting", "Clutch Repair", "Suspension Work", "Periodic Maintenance", "Tyre Service"].map((service) => (
                    <span key={service} className="px-3 py-1 bg-secondary rounded-full text-sm text-foreground">
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

        {/* Garage Owner CTA Section */}
        <section className="py-8 md:py-10 bg-foreground" aria-label="List your garage">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-background mb-4">
              Own a Garage?
            </h2>
            <p className="text-xl text-background/70 mb-8 max-w-2xl mx-auto">
              Join thousands of garages and start collecting reviews from your customers today.
            </p>
            <Link to="/list-garage">
              <Button size="lg" className="text-lg px-8 h-14 rounded-xl">
                List Your Garage
              </Button>
            </Link>
          </div>
        </section>

        {/* Why List Your Garage - Visual Banner for Garage Owners */}
        <section className="py-10 md:py-12 bg-gradient-to-br from-primary/5 via-background to-accent/5 relative overflow-hidden">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-10 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
          </div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="grid md:grid-cols-2 gap-6 items-center">
              <div>
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                  <Award className="w-4 h-4" />
                  For Garage Owners
                </span>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Grow Your Business with MeriGarage
                </h2>
                <p className="text-lg text-muted-foreground mb-6">
                  Join India's fastest-growing garage discovery platform. Get discovered by thousands of car owners actively looking for trusted mechanics.
                </p>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="text-sm font-medium text-foreground">Free Listing</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Search className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-foreground">Get Found Online</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <Star className="w-5 h-5 text-purple-600" />
                    </div>
                    <span className="text-sm font-medium text-foreground">Build Reputation</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-orange-600" />
                    </div>
                    <span className="text-sm font-medium text-foreground">Get More Customers</span>
                  </div>
                </div>
                <Link to="/list-garage">
                  <Button size="lg" className="gap-2">
                    <Award className="w-5 h-5" />
                    List Your Garage Free
                  </Button>
                </Link>
              </div>
              <div className="bg-card rounded-2xl p-6 shadow-xl border border-border">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <Car className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">AutoCare Motors</h4>
                    <p className="text-xs text-muted-foreground">Mumbai, Maharashtra</p>
                  </div>
                  <span className="ml-auto px-2 py-1 bg-green-500/10 text-green-600 text-xs font-medium rounded-full">Verified</span>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-secondary/50 rounded-lg">
                    <p className="text-2xl font-bold text-primary">4.8</p>
                    <p className="text-xs text-muted-foreground">Rating</p>
                  </div>
                  <div className="text-center p-3 bg-secondary/50 rounded-lg">
                    <p className="text-2xl font-bold text-primary">156</p>
                    <p className="text-xs text-muted-foreground">Reviews</p>
                  </div>
                  <div className="text-center p-3 bg-secondary/50 rounded-lg">
                    <p className="text-2xl font-bold text-primary">89</p>
                    <p className="text-xs text-muted-foreground">Leads/Month</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground italic text-center">
                  "MeriGarage brought us 40% more customers in just 3 months!"
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Why Write Reviews - Visual Banner for Customers */}
        <section className="py-10 md:py-12 bg-gradient-to-br from-accent/5 via-background to-primary/5 relative overflow-hidden">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-20 right-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl" />
            <div className="absolute bottom-20 left-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
          </div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="grid md:grid-cols-2 gap-6 items-center">
              <div className="order-2 md:order-1">
                <div className="bg-card rounded-2xl p-6 shadow-xl border border-border">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="font-semibold text-foreground">Your Review Impact</h4>
                    <span className="text-xs text-muted-foreground">Real stats</span>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                        <Star className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">Help 50+ Car Owners</p>
                        <p className="text-xs text-muted-foreground">Your review guides others</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                        <Gift className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">Earn 50 Reward Points</p>
                        <p className="text-xs text-muted-foreground">Redeem for exciting rewards</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                        <ShieldCheck className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">Make Garages Accountable</p>
                        <p className="text-xs text-muted-foreground">Improve service quality</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
                  <Star className="w-4 h-4" />
                  For Car Owners
                </span>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Your Voice Matters!
                </h2>
                <p className="text-lg text-muted-foreground mb-6">
                  Every review you write helps fellow car owners make better decisions. Share your experience and earn rewards while building a trusted community.
                </p>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-foreground">Reading reviews is free, no login required</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-foreground">Write reviews and earn points</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-foreground">Upload receipt for verified badge & bonus points</span>
                  </div>
                </div>
                <Link to="/submit-review">
                  <Button size="lg" variant="secondary" className="gap-2">
                    <Star className="w-5 h-5" />
                    Write Your First Review
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Car Care Tips - Dynamic from Blog */}
        <CarCareTipsSection />
      </main>

      <Footer />
    </div>
  );
};

export default Index;