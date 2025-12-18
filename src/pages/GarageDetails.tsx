import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MapPin, Phone, Globe, Clock, ChevronDown, ChevronUp, Share2, Heart, PenSquare } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { StarRating } from "@/components/StarRating";
import { RatingBreakdown } from "@/components/RatingBreakdown";
import { ReviewCard } from "@/components/ReviewCard";
import { GarageBadges } from "@/components/GarageBadges";
import { GarageServiceTags } from "@/components/GarageServiceTags";
import { GarageActivityStats } from "@/components/GarageActivityStats";
import { GarageMapPreview } from "@/components/GarageMapPreview";
import { GetQuoteDialog } from "@/components/GetQuoteDialog";
import { GarageOffers } from "@/components/GarageOffers";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const mockGarage = {
  id: "1",
  name: "AutoCare Pro Center",
  address: "123 Main Street, Manhattan, New York, NY 10001",
  phone: "+1 (555) 123-4567",
  website: "www.autocarepro.com",
  hours: "Mon-Fri: 8AM-6PM, Sat: 9AM-4PM",
  imageUrl: "https://images.unsplash.com/photo-1625047509248-ec889cbff17f?w=1200&h=600&fit=crop",
  rating: 4.9,
  totalReviews: 342,
  tags: ["General Service", "AC Repair", "Body Work", "Tyres", "Diagnostics", "Multi-brand", "Premium Cars"],
  categories: [
    { name: "Service Quality", rating: 4.9 },
    { name: "Pricing", rating: 4.7 },
    { name: "Timeliness", rating: 4.8 },
    { name: "Communication", rating: 4.9 },
  ],
  distribution: [
    { stars: 5, count: 280 },
    { stars: 4, count: 45 },
    { stars: 3, count: 12 },
    { stars: 2, count: 3 },
    { stars: 1, count: 2 },
  ],
  // Badge data
  isVerified: true,
  isCertified: true,
  isRecommended: true,
  hasDiscounts: true,
  // Activity data
  responseTime: "30-45 mins",
  quotesThisMonth: 125,
  walkInWelcome: true,
  hasVerifiedLicense: true,
  // Map
  locationLink: "https://maps.google.com/?q=Manhattan,New+York",
};

const mockReviews = [
  {
    id: "1",
    username: "Michael R.",
    rating: 5,
    reviewText: "Best garage experience I've ever had! They diagnosed my car issue quickly and the repair was done the same day. The staff was incredibly professional and kept me informed throughout the process. Highly recommend!",
    date: "November 15, 2024",
    tags: ["Quick Service", "Professional"],
    images: [],
    helpfulCount: 24,
  },
  {
    id: "2",
    username: "Sarah J.",
    rating: 5,
    reviewText: "I've been coming here for all my car maintenance needs for the past 2 years. They're always honest about what needs to be done and what can wait. Fair pricing and excellent work.",
    date: "November 10, 2024",
    tags: ["Fair Pricing", "Honest"],
    images: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop",
    ],
    helpfulCount: 18,
  },
  {
    id: "3",
    username: "David K.",
    rating: 4,
    reviewText: "Good service overall. Had to wait a bit longer than expected but the quality of work was excellent. They even washed my car before returning it!",
    date: "November 5, 2024",
    tags: ["Quality Work"],
    images: [],
    helpfulCount: 12,
  },
  {
    id: "4",
    username: "Emily T.",
    rating: 5,
    reviewText: "Found them through this website and couldn't be happier. They fixed an electrical issue that two other shops couldn't figure out. True experts!",
    date: "October 28, 2024",
    tags: ["Expert Mechanics", "Problem Solvers"],
    images: [],
    helpfulCount: 31,
  },
];

const GarageDetails = () => {
  const { id } = useParams();
  const [showAllTags, setShowAllTags] = useState(false);
  const [reviewSort, setReviewSort] = useState("recent");

  const displayedTags = showAllTags ? mockGarage.tags : mockGarage.tags.slice(0, 4);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Image */}
        <div className="relative h-64 md:h-96 overflow-hidden">
          <img
            src={mockGarage.imageUrl}
            alt={mockGarage.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
            <div className="container mx-auto">
              <h1 className="text-3xl md:text-5xl font-bold text-primary-foreground mb-2">
                {mockGarage.name}
              </h1>
              <div className="flex items-center gap-4 flex-wrap mb-4">
                <StarRating rating={mockGarage.rating} showValue size="lg" />
                <span className="text-primary-foreground/80">
                  ({mockGarage.totalReviews} reviews)
                </span>
              </div>
              {/* Badges on Hero */}
              <div className="hidden md:block">
                <GarageBadges
                  isVerified={mockGarage.isVerified}
                  isCertified={mockGarage.isCertified}
                  isRecommended={mockGarage.isRecommended}
                  hasDiscounts={mockGarage.hasDiscounts}
                  size="md"
                  showTooltip={true}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Mobile Badges */}
          <div className="md:hidden mb-6">
            <GarageBadges
              isVerified={mockGarage.isVerified}
              isCertified={mockGarage.isCertified}
              isRecommended={mockGarage.isRecommended}
              hasDiscounts={mockGarage.hasDiscounts}
              size="sm"
              showTooltip={true}
            />
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Content */}
            <div className="flex-1">
              {/* Quick Info */}
              <div className="bg-card rounded-2xl p-6 shadow-md border border-border mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <span className="text-sm text-muted-foreground">Address</span>
                      <p className="text-foreground">{mockGarage.address}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <span className="text-sm text-muted-foreground">Phone</span>
                      <p className="text-foreground">{mockGarage.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Globe className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <span className="text-sm text-muted-foreground">Website</span>
                      <p className="text-foreground">{mockGarage.website}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <span className="text-sm text-muted-foreground">Hours</span>
                      <p className="text-foreground">{mockGarage.hours}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Special Offers */}
              {id && <GarageOffers garageId={id} />}

              {/* Activity Stats */}
              <div className="bg-card rounded-2xl p-6 shadow-md border border-border mb-8">
                <h2 className="text-xl font-semibold text-foreground mb-4">Garage Activity</h2>
                <GarageActivityStats
                  responseTime={mockGarage.responseTime}
                  quotesThisMonth={mockGarage.quotesThisMonth}
                  walkInWelcome={mockGarage.walkInWelcome}
                  hasVerifiedLicense={mockGarage.hasVerifiedLicense}
                  variant="full"
                />
              </div>

              {/* Service Tags */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-foreground mb-4">Services & Specializations</h2>
                <GarageServiceTags 
                  services={displayedTags} 
                  showAll={true} 
                  size="md"
                />
                {mockGarage.tags.length > 4 && (
                  <button
                    onClick={() => setShowAllTags(!showAllTags)}
                    className="flex items-center gap-1 text-primary text-sm font-medium mt-3 hover:underline"
                  >
                    {showAllTags ? (
                      <>Show Less <ChevronUp className="w-4 h-4" /></>
                    ) : (
                      <>Show All ({mockGarage.tags.length}) <ChevronDown className="w-4 h-4" /></>
                    )}
                  </button>
                )}
              </div>

              {/* Google Map */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-foreground mb-4">Location</h2>
                <GarageMapPreview
                  locationLink={mockGarage.locationLink}
                  address={mockGarage.address}
                  garageName={mockGarage.name}
                  variant="full"
                />
              </div>

              {/* Rating Breakdown */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-foreground mb-4">Ratings & Reviews</h2>
                <RatingBreakdown
                  overall={mockGarage.rating}
                  totalReviews={mockGarage.totalReviews}
                  categories={mockGarage.categories}
                  distribution={mockGarage.distribution}
                />
              </div>

              {/* Reviews */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-foreground">
                    Customer Reviews ({mockReviews.length})
                  </h2>
                  <Select value={reviewSort} onValueChange={setReviewSort}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Most Recent</SelectItem>
                      <SelectItem value="helpful">Most Helpful</SelectItem>
                      <SelectItem value="highest">Highest Rated</SelectItem>
                      <SelectItem value="lowest">Lowest Rated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-4">
                  {mockReviews.map((review, index) => (
                    <div
                      key={review.id}
                      className="animate-fade-in"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <ReviewCard {...review} />
                    </div>
                  ))}
                </div>

                <div className="mt-8 text-center">
                  <Button variant="outline" size="lg">
                    Load More Reviews
                  </Button>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <aside className="lg:w-80 flex-shrink-0">
              <div className="sticky top-24 space-y-4">
                {/* Get Quote - Primary CTA */}
                <GetQuoteDialog
                  garageName={mockGarage.name}
                  garageId={mockGarage.id}
                  variant="primary"
                  size="lg"
                  className="w-full h-14 text-lg rounded-xl shadow-glow"
                />

                <Link to={`/garage/${id}/review`}>
                  <Button variant="outline" size="lg" className="w-full gap-2 h-14 text-lg rounded-xl">
                    <PenSquare className="w-5 h-5" />
                    Write a Review
                  </Button>
                </Link>
                
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 gap-2">
                    <Share2 className="w-4 h-4" />
                    Share
                  </Button>
                  <Button variant="outline" className="flex-1 gap-2">
                    <Heart className="w-4 h-4" />
                    Save
                  </Button>
                </div>

                <div className="bg-card rounded-2xl p-6 shadow-md border border-border">
                  <h3 className="font-semibold text-foreground mb-4">Quick Stats</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Response Rate</span>
                      <span className="font-medium text-foreground">98%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Avg Response Time</span>
                      <span className="font-medium text-foreground">{mockGarage.responseTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Years in Business</span>
                      <span className="font-medium text-foreground">12 years</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Verified Garage</span>
                      <span className="font-medium text-success">✓ Yes</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Quotes This Month</span>
                      <span className="font-medium text-primary">{mockGarage.quotesThisMonth}</span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default GarageDetails;
