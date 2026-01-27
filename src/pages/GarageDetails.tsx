import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { MapPin, Phone, Globe, Clock, ChevronDown, ChevronUp, Heart, PenSquare, Loader2, AlertTriangle, Building2 } from "lucide-react";
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
import { ClaimGarageDialog } from "@/components/ClaimGarageDialog";
import { SEOHead } from "@/components/SEOHead";
import { ShareDialog } from "@/components/ShareDialog";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import defaultGaragePlaceholder from "@/assets/default-garage-placeholder.png";

interface Garage {
  id: string;
  name: string;
  slug: string | null;
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
  owner_id: string | null;
  captured_latitude: number | null;
  captured_longitude: number | null;
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
  is_verified: boolean | null;
  customer_name: string | null;
  customer_display_name: string | null;
}

// Helper to check if a string is a valid UUID
const isUUID = (str: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

const GarageDetails = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isGarageOwner } = useUserRole();
  const [showAllTags, setShowAllTags] = useState(false);
  const [reviewSort, setReviewSort] = useState("recent");
  const [garage, setGarage] = useState<Garage | null>(null);
  const [photos, setPhotos] = useState<GaragePhoto[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGarageData = async () => {
      if (!slug) return;

      setLoading(true);
      try {
        let garageData = null;
        let garageError = null;

        // Check if the URL parameter is a UUID (old format) or slug (new format)
        if (isUUID(slug)) {
          // Fetch by ID and redirect to slug-based URL
          const result = await supabase
            .from('garages')
            .select('*')
            .eq('id', slug)
            .maybeSingle();
          
          garageData = result.data;
          garageError = result.error;

          // If found, redirect to the slug-based URL
          if (garageData?.slug) {
            navigate(`/garage/${garageData.slug}`, { replace: true });
            return;
          }
        } else {
          // Fetch by slug (new format)
          const result = await supabase
            .from('garages')
            .select('*')
            .eq('slug', slug)
            .maybeSingle();
          
          garageData = result.data;
          garageError = result.error;
        }

        if (garageError) {
          console.error('Error fetching garage:', garageError);
        } else {
          setGarage(garageData);
        }

        // Fetch garage photos using garage id from fetched data
        const { data: photosData, error: photosError } = garageData ? await supabase
          .from('garage_photos')
          .select('*')
          .eq('garage_id', garageData.id)
          .order('display_order', { ascending: true }) : { data: null, error: null };

        if (photosError) {
          console.error('Error fetching photos:', photosError);
        } else {
          setPhotos(photosData || []);
        }

        // Fetch approved reviews for this garage with customer profiles
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('user_reviews')
          .select('id, rating, review_text, created_at, garage_name, is_verified, user_id, customer_display_name')
          .eq('garage_name', garageData?.name || '')
          .eq('status', 'approved')
          .order('created_at', { ascending: false });

        if (reviewsError) {
          console.error('Error fetching reviews:', reviewsError);
          setReviews([]);
        } else {
          // Fetch profiles for all review authors
          const userIds = (reviewsData || []).map(r => r.user_id);
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('user_id, full_name')
            .in('user_id', userIds);
          
          const profileMap = new Map<string, string>();
          profilesData?.forEach(p => {
            if (p.full_name) {
              // Format name for privacy: "First L." format
              const nameParts = p.full_name.trim().split(' ');
              const firstName = nameParts[0];
              const lastInitial = nameParts.length > 1 ? ` ${nameParts[nameParts.length - 1].charAt(0)}.` : '';
              profileMap.set(p.user_id, `${firstName}${lastInitial}`);
            }
          });

          const mappedReviews: Review[] = (reviewsData || []).map(r => {
            // Use customer_display_name if set, otherwise format profile name for privacy
            let displayName: string | null = null;
            if (r.customer_display_name) {
              // Format display name for privacy: "First L." format
              const nameParts = r.customer_display_name.trim().split(' ');
              const firstName = nameParts[0];
              const lastInitial = nameParts.length > 1 ? ` ${nameParts[nameParts.length - 1].charAt(0)}.` : '';
              displayName = `${firstName}${lastInitial}`;
            } else {
              displayName = profileMap.get(r.user_id) || null;
            }

            return {
              id: r.id,
              rating: r.rating,
              review_text: r.review_text,
              created_at: r.created_at,
              garage_name: r.garage_name,
              is_verified: r.is_verified,
              customer_name: displayName,
              customer_display_name: r.customer_display_name,
            };
          });
          
          setReviews(mappedReviews);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGarageData();
  }, [slug, navigate]);

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
    : garage.photo_url || defaultGaragePlaceholder;

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

  // Generate SEO data
  const seoTitle = `${garage.name} - Reviews & Ratings | MeriGarage`;
  const seoDescription = `Read ${garage.review_count || 0} verified reviews for ${garage.name} in ${garage.city || garage.state || 'India'}. Rating: ${garage.rating?.toFixed(1) || '5.0'}/5. Services: ${(garage.services || []).slice(0, 3).join(', ') || 'Auto repair'}. Get quotes and book now.`;
  const canonicalUrl = `https://merigaragereviews.com/garage/${garage.slug || slug}`;
  const ogImage = heroImage.startsWith('http') ? heroImage : `https://merigaragereviews.com${heroImage}`;
  const seoKeywords = [
    garage.name,
    `${garage.name} reviews`,
    `garage in ${garage.city}`,
    `auto repair ${garage.city}`,
    ...(garage.services || []).slice(0, 5),
  ].join(', ');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        canonicalUrl={canonicalUrl}
        ogImage={ogImage}
        ogType="profile"
        keywords={seoKeywords}
      />
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
          {/* Unclaimed Garage Banner */}
          {!garage.owner_id && (
            <div className="mb-6 bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-4 md:p-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-amber-600" />
                      Unclaimed Garage Listing
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      This garage is not yet claimed by its owner. Are you the owner? Claim this listing to manage your garage profile and respond to reviews.
                    </p>
                  </div>
                </div>
                <div className="md:flex-shrink-0">
                  <ClaimGarageDialog garageId={garage.id} garageName={garage.name} />
                </div>
              </div>
            </div>
          )}

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
              {garage.id && <GarageOffers garageId={garage.id} />}

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
              {(garage.location_link || garage.captured_latitude) && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-foreground mb-4">Location</h2>
                  <GarageMapPreview
                    locationLink={garage.location_link || undefined}
                    address={fullAddress}
                    garageName={garage.name}
                    variant="full"
                    latitude={garage.captured_latitude || undefined}
                    longitude={garage.captured_longitude || undefined}
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
                    <Link to={`/garage/${garage.slug || slug}/review`}>
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
                            username={review.customer_name || "Customer"}
                            rating={review.rating}
                            reviewText={review.review_text || ''}
                            date={formatDate(review.created_at)}
                            tags={[]}
                            images={[]}
                            helpfulCount={0}
                            isVerifiedCustomer={true}
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

                {isGarageOwner ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="w-full">
                        <Button 
                          variant="outline" 
                          size="lg" 
                          className="w-full gap-2 h-14 text-lg rounded-xl opacity-50 cursor-not-allowed"
                          disabled
                        >
                          <PenSquare className="w-5 h-5" />
                          Write a Review
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-popover text-popover-foreground">
                      <p>Please login as a customer to write a review</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Link to={`/garage/${garage.slug || slug}/review`}>
                    <Button variant="outline" size="lg" className="w-full gap-2 h-14 text-lg rounded-xl">
                      <PenSquare className="w-5 h-5" />
                      Write a Review
                    </Button>
                  </Link>
                )}
                
                <div className="flex gap-3">
                  <ShareDialog
                    url={`/garage/${garage.slug || slug}`}
                    title={garage.name}
                    description={`Check out ${garage.name} - rated ${garage.rating?.toFixed(1) || '5.0'}/5 with ${garage.review_count || 0} reviews. ${(garage.services || []).slice(0, 3).join(', ')}`}
                    className="flex-1"
                  />
                  <Button variant="outline" className="flex-1 gap-2">
                    <Heart className="w-4 h-4" />
                    Save
                  </Button>
                </div>

                {/* Claim Garage Button removed from sidebar - now only in the banner above */}

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
