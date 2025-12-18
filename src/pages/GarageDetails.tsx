import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { MapPin, Phone, Globe, Clock, ChevronDown, ChevronUp, Share2, Heart, PenSquare, Loader2 } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";

interface Garage {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  phone: string | null;
  photo_url: string | null;
  rating: number | null;
  review_count: number | null;
  services: string[] | null;
  is_verified: boolean | null;
  is_certified: boolean | null;
  is_recommended: boolean | null;
  has_discounts: boolean | null;
  response_time: string | null;
  walk_in_welcome: boolean | null;
  location_link: string | null;
}

interface GaragePhoto {
  id: string;
  photo_url: string;
  display_order: number | null;
}

interface Review {
  id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  garage_name: string;
}

const GarageDetails = () => {
  const { id } = useParams();
  const [showAllTags, setShowAllTags] = useState(false);
  const [reviewSort, setReviewSort] = useState("recent");
  const [garage, setGarage] = useState<Garage | null>(null);
  const [photos, setPhotos] = useState<GaragePhoto[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGarageData = async () => {
      if (!id) return;

      setLoading(true);
      try {
        // Fetch garage details
        const { data: garageData, error: garageError } = await supabase
          .from('garages')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (garageError) {
          console.error('Error fetching garage:', garageError);
        } else {
          setGarage(garageData);
        }

        // Fetch garage photos
        const { data: photosData, error: photosError } = await supabase
          .from('garage_photos')
          .select('*')
          .eq('garage_id', id)
          .order('display_order', { ascending: true });

        if (photosError) {
          console.error('Error fetching photos:', photosError);
        } else {
          setPhotos(photosData || []);
        }

        // Fetch approved reviews for this garage
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('user_reviews')
          .select('id, rating, review_text, created_at, garage_name')
          .eq('garage_name', garageData?.name || '')
          .eq('status', 'approved')
          .order('created_at', { ascending: false });

        if (reviewsError) {
          console.error('Error fetching reviews:', reviewsError);
        } else {
          setReviews(reviewsData || []);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGarageData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!garage) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">Garage Not Found</h1>
            <p className="text-muted-foreground mb-4">The garage you're looking for doesn't exist.</p>
            <Link to="/">
              <Button>Back to Home</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const fullAddress = [garage.address, garage.city, garage.state, garage.country]
    .filter(Boolean)
    .join(', ');

  const heroImage = photos.length > 0 
    ? photos[0].photo_url 
    : garage.photo_url || "https://images.unsplash.com/photo-1625047509248-ec889cbff17f?w=1200&h=600&fit=crop";

  const services = garage.services || [];
  const displayedTags = showAllTags ? services : services.slice(0, 4);

  // Calculate rating distribution from reviews
  const distribution = [5, 4, 3, 2, 1].map(stars => ({
    stars,
    count: reviews.filter(r => r.rating === stars).length
  }));

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Image */}
        <div className="relative h-64 md:h-96 overflow-hidden">
          <img
            src={heroImage}
            alt={garage.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
            <div className="container mx-auto">
              <h1 className="text-3xl md:text-5xl font-bold text-primary-foreground mb-2">
                {garage.name}
              </h1>
              <div className="flex items-center gap-4 flex-wrap mb-4">
                <StarRating rating={garage.rating || 5} showValue size="lg" />
                <span className="text-primary-foreground/80">
                  ({garage.review_count || 0} reviews)
                </span>
              </div>
              {/* Badges on Hero */}
              <div className="hidden md:block">
                <GarageBadges
                  isVerified={garage.is_verified || false}
                  isCertified={garage.is_certified || false}
                  isRecommended={garage.is_recommended || false}
                  hasDiscounts={garage.has_discounts || false}
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
              isVerified={garage.is_verified || false}
              isCertified={garage.is_certified || false}
              isRecommended={garage.is_recommended || false}
              hasDiscounts={garage.has_discounts || false}
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
                      <p className="text-foreground">{fullAddress || 'Address not available'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <span className="text-sm text-muted-foreground">Phone</span>
                      <p className="text-foreground">{garage.phone || 'Not available'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Globe className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <span className="text-sm text-muted-foreground">Location</span>
                      <p className="text-foreground">{garage.city}, {garage.state}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <span className="text-sm text-muted-foreground">Response Time</span>
                      <p className="text-foreground">{garage.response_time || 'Contact for availability'}</p>
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
                  responseTime={garage.response_time || undefined}
                  walkInWelcome={garage.walk_in_welcome || undefined}
                  hasVerifiedLicense={garage.is_verified || undefined}
                  variant="full"
                />
              </div>

              {/* Service Tags */}
              {services.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-foreground mb-4">Services & Specializations</h2>
                  <GarageServiceTags 
                    services={displayedTags} 
                    showAll={true} 
                    size="md"
                  />
                  {services.length > 4 && (
                    <button
                      onClick={() => setShowAllTags(!showAllTags)}
                      className="flex items-center gap-1 text-primary text-sm font-medium mt-3 hover:underline"
                    >
                      {showAllTags ? (
                        <>Show Less <ChevronUp className="w-4 h-4" /></>
                      ) : (
                        <>Show All ({services.length}) <ChevronDown className="w-4 h-4" /></>
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* Google Map */}
              {garage.location_link && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-foreground mb-4">Location</h2>
                  <GarageMapPreview
                    locationLink={garage.location_link}
                    address={fullAddress}
                    garageName={garage.name}
                    variant="full"
                  />
                </div>
              )}

              {/* Rating Breakdown */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-foreground mb-4">Ratings & Reviews</h2>
                <RatingBreakdown
                  overall={garage.rating || 5}
                  totalReviews={reviews.length}
                  categories={[
                    { name: "Service Quality", rating: garage.rating || 5 },
                    { name: "Value for Money", rating: garage.rating || 5 },
                  ]}
                  distribution={distribution}
                />
              </div>

              {/* Reviews */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-foreground">
                    Customer Reviews ({reviews.length})
                  </h2>
                  <Select value={reviewSort} onValueChange={setReviewSort}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Most Recent</SelectItem>
                      <SelectItem value="highest">Highest Rated</SelectItem>
                      <SelectItem value="lowest">Lowest Rated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {reviews.length === 0 ? (
                  <div className="text-center py-8 bg-card rounded-2xl border border-border">
                    <p className="text-muted-foreground mb-4">No reviews yet. Be the first to review!</p>
                    <Link to={`/garage/${id}/review`}>
                      <Button>Write a Review</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {[...reviews]
                      .sort((a, b) => {
                        if (reviewSort === 'highest') return b.rating - a.rating;
                        if (reviewSort === 'lowest') return a.rating - b.rating;
                        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                      })
                      .map((review, index) => (
                        <div
                          key={review.id}
                          className="animate-fade-in"
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                        <ReviewCard 
                            username="Verified Customer"
                            rating={review.rating}
                            reviewText={review.review_text || ''}
                            date={formatDate(review.created_at)}
                            tags={[]}
                            images={[]}
                            helpfulCount={0}
                          />
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <aside className="lg:w-80 flex-shrink-0">
              <div className="sticky top-24 space-y-4">
                {/* Get Quote - Primary CTA */}
                <GetQuoteDialog
                  garageName={garage.name}
                  garageId={garage.id}
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
                      <span className="text-muted-foreground">Response Time</span>
                      <span className="font-medium text-foreground">{garage.response_time || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Walk-in Welcome</span>
                      <span className="font-medium text-foreground">{garage.walk_in_welcome ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Verified Garage</span>
                      <span className={`font-medium ${garage.is_verified ? 'text-success' : 'text-muted-foreground'}`}>
                        {garage.is_verified ? '✓ Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Reviews</span>
                      <span className="font-medium text-primary">{reviews.length}</span>
                    </div>
                  </div>
                </div>

                {/* Photo Gallery */}
                {photos.length > 1 && (
                  <div className="bg-card rounded-2xl p-6 shadow-md border border-border">
                    <h3 className="font-semibold text-foreground mb-4">Photos</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {photos.slice(0, 4).map((photo) => (
                        <img
                          key={photo.id}
                          src={photo.photo_url}
                          alt="Garage"
                          className="w-full h-20 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  </div>
                )}
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
