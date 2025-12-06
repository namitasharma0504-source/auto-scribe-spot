import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Building2, Star, MessageSquare, TrendingUp, Eye, 
  Settings, Image, Wrench, ExternalLink, BarChart3,
  Award, Users, Calendar, ArrowUp, ArrowDown, BadgeCheck,
  Percent, ShieldCheck, Clock, Info
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

// Sample analytics data
const viewsData = [
  { month: "Jan", views: 120 },
  { month: "Feb", views: 180 },
  { month: "Mar", views: 250 },
  { month: "Apr", views: 220 },
  { month: "May", views: 340 },
  { month: "Jun", views: 420 },
];

const ratingsData = [
  { month: "Jan", rating: 4.2 },
  { month: "Feb", rating: 4.4 },
  { month: "Mar", rating: 4.3 },
  { month: "Apr", rating: 4.5 },
  { month: "May", rating: 4.6 },
  { month: "Jun", rating: 4.7 },
];

export default function GarageDashboard() {
  const [garageOwner, setGarageOwner] = useState<any>(null);
  const [garage, setGarage] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingBadges, setIsSavingBadges] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    state: "",
    city: "",
    country: "India",
    location_link: "",
    photo_url: "",
    services: [] as string[],
    pricing: "",
    special_offers: "",
  });

  // Badge state
  const [badgeData, setBadgeData] = useState({
    is_verified: false,
    is_certified: false,
    is_recommended: false,
    has_discounts: false,
    response_time: "",
    walk_in_welcome: true,
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/garage-auth");
        return;
      }

      // Get garage owner profile
      const { data: owner, error: ownerError } = await supabase
        .from("garage_owners")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (ownerError || !owner) {
        toast({
          title: "Access Denied",
          description: "You don't have a garage owner account.",
          variant: "destructive",
        });
        navigate("/garage-auth");
        return;
      }

      setGarageOwner(owner);

      // Get garage if exists
      if (owner.garage_id) {
        const { data: garageData } = await supabase
          .from("garages")
          .select("*")
          .eq("id", owner.garage_id)
          .single();

        if (garageData) {
          setGarage(garageData);
          setFormData({
            name: garageData.name || "",
            phone: garageData.phone || "",
            address: garageData.address || "",
            state: garageData.state || "",
            city: garageData.city || "",
            country: garageData.country || "India",
            location_link: garageData.location_link || "",
            photo_url: garageData.photo_url || "",
            services: garageData.services || [],
            pricing: garageData.pricing || "",
            special_offers: garageData.special_offers || "",
          });
          setBadgeData({
            is_verified: garageData.is_verified || false,
            is_certified: garageData.is_certified || false,
            is_recommended: garageData.is_recommended || false,
            has_discounts: garageData.has_discounts || false,
            response_time: garageData.response_time || "",
            walk_in_welcome: garageData.walk_in_welcome ?? true,
          });
        }
      }

      setIsLoading(false);
    };

    checkAuth();
  }, [navigate, toast]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const garageData = {
        ...formData,
        owner_id: session.user.id,
        services: typeof formData.services === "string" 
          ? (formData.services as string).split(",").map(s => s.trim()) 
          : formData.services,
      };

      if (garage) {
        // Update existing garage
        const { error } = await supabase
          .from("garages")
          .update(garageData)
          .eq("id", garage.id);

        if (error) throw error;
      } else {
        // Create new garage
        const { data: newGarage, error } = await supabase
          .from("garages")
          .insert(garageData)
          .select()
          .single();

        if (error) throw error;

        // Update garage owner with garage_id
        await supabase
          .from("garage_owners")
          .update({ garage_id: newGarage.id })
          .eq("user_id", session.user.id);

        setGarage(newGarage);
      }

      toast({
        title: "Profile Saved!",
        description: "Your garage profile has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBadges = async () => {
    if (!garage) {
      toast({
        title: "No Garage Found",
        description: "Please save your garage profile first before managing badges.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingBadges(true);
    try {
      const { error } = await supabase
        .from("garages")
        .update(badgeData)
        .eq("id", garage.id);

      if (error) throw error;

      setGarage({ ...garage, ...badgeData });

      toast({
        title: "Badges Updated!",
        description: "Your garage badges and highlights have been saved.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSavingBadges(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Garage Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {garageOwner?.business_name || "Garage Owner"}
            </p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Overall Rating</p>
                  <p className="text-2xl font-bold text-foreground">{garage?.rating || "5.0"}</p>
                </div>
                <Star className="w-8 h-8 text-primary fill-primary" />
              </div>
              <p className="text-xs text-green-500 mt-2 flex items-center gap-1">
                <ArrowUp className="w-3 h-3" /> +0.2 this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Reviews</p>
                  <p className="text-2xl font-bold text-foreground">{garage?.review_count || 0}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-accent" />
              </div>
              <p className="text-xs text-green-500 mt-2 flex items-center gap-1">
                <ArrowUp className="w-3 h-3" /> +5 this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Profile Views</p>
                  <p className="text-2xl font-bold text-foreground">1,234</p>
                </div>
                <Eye className="w-8 h-8 text-primary" />
              </div>
              <p className="text-xs text-green-500 mt-2 flex items-center gap-1">
                <ArrowUp className="w-3 h-3" /> +12% this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Inquiries</p>
                  <p className="text-2xl font-bold text-foreground">42</p>
                </div>
                <Users className="w-8 h-8 text-accent" />
              </div>
              <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                <ArrowDown className="w-3 h-3" /> -3% this month
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 max-w-3xl">
            <TabsTrigger value="profile" className="gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="badges" className="gap-2">
              <BadgeCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Badges</span>
            </TabsTrigger>
            <TabsTrigger value="reviews" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Reviews</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="photos" className="gap-2">
              <Image className="w-4 h-4" />
              <span className="hidden sm:inline">Photos</span>
            </TabsTrigger>
            <TabsTrigger value="upgrade" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Upgrade</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Garage Profile</CardTitle>
                <CardDescription>Update your garage information visible to customers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Garage Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Your Garage Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 9876543210"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Full address"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="City"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="State"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      placeholder="Country"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location_link">Google Maps Link</Label>
                    <Input
                      id="location_link"
                      value={formData.location_link}
                      onChange={(e) => setFormData({ ...formData, location_link: e.target.value })}
                      placeholder="https://maps.google.com/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="photo_url">Photo URL</Label>
                    <Input
                      id="photo_url"
                      value={formData.photo_url}
                      onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="services">Services Offered (comma separated)</Label>
                  <Textarea
                    id="services"
                    value={Array.isArray(formData.services) ? formData.services.join(", ") : formData.services}
                    onChange={(e) => setFormData({ ...formData, services: e.target.value.split(",").map(s => s.trim()) })}
                    placeholder="Oil Change, Brake Repair, AC Service, ..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pricing">Pricing Information</Label>
                    <Textarea
                      id="pricing"
                      value={formData.pricing}
                      onChange={(e) => setFormData({ ...formData, pricing: e.target.value })}
                      placeholder="Basic Service: ₹999, Full Service: ₹2999..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="special_offers">Special Offers</Label>
                    <Textarea
                      id="special_offers"
                      value={formData.special_offers}
                      onChange={(e) => setFormData({ ...formData, special_offers: e.target.value })}
                      placeholder="20% off on first visit..."
                    />
                  </div>
                </div>

                <Button onClick={handleSaveProfile} disabled={isSaving} className="w-full md:w-auto">
                  {isSaving ? "Saving..." : "Save Profile"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Badges Tab */}
          <TabsContent value="badges">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BadgeCheck className="w-6 h-6 text-primary" />
                  Garage Badges & Highlights
                </CardTitle>
                <CardDescription>
                  Customize the badges that appear on your garage listing to attract more customers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Info Banner */}
                <div className="flex items-start gap-3 p-4 bg-accent/10 rounded-xl border border-accent/20">
                  <Info className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    These highlights will be displayed on your garage listing. Enable badges that accurately 
                    represent your garage to build trust with potential customers.
                  </p>
                </div>

                {/* Badge Toggles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Verified Garage */}
                  <div className="flex items-center justify-between p-4 bg-card rounded-xl border border-border">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                        <BadgeCheck className="w-5 h-5 text-success" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">Verified Garage</h4>
                        <p className="text-sm text-muted-foreground">Show that your garage is verified</p>
                      </div>
                    </div>
                    <Switch
                      checked={badgeData.is_verified}
                      onCheckedChange={(checked) => setBadgeData({ ...badgeData, is_verified: checked })}
                    />
                  </div>

                  {/* Certified Mechanics */}
                  <div className="flex items-center justify-between p-4 bg-card rounded-xl border border-border">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                        <Wrench className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">Certified Mechanics</h4>
                        <p className="text-sm text-muted-foreground">Your mechanics are certified</p>
                      </div>
                    </div>
                    <Switch
                      checked={badgeData.is_certified}
                      onCheckedChange={(checked) => setBadgeData({ ...badgeData, is_certified: checked })}
                    />
                  </div>

                  {/* Recommended */}
                  <div className="flex items-center justify-between p-4 bg-card rounded-xl border border-border">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-star/10 flex items-center justify-center">
                        <Award className="w-5 h-5 text-star" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">Recommended</h4>
                        <p className="text-sm text-muted-foreground">Highlight based on reviews</p>
                      </div>
                    </div>
                    <Switch
                      checked={badgeData.is_recommended}
                      onCheckedChange={(checked) => setBadgeData({ ...badgeData, is_recommended: checked })}
                    />
                  </div>

                  {/* Discounts Available */}
                  <div className="flex items-center justify-between p-4 bg-card rounded-xl border border-border">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Percent className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">Discounts Available</h4>
                        <p className="text-sm text-muted-foreground">Show you have special offers</p>
                      </div>
                    </div>
                    <Switch
                      checked={badgeData.has_discounts}
                      onCheckedChange={(checked) => setBadgeData({ ...badgeData, has_discounts: checked })}
                    />
                  </div>

                  {/* Walk-ins Welcome */}
                  <div className="flex items-center justify-between p-4 bg-card rounded-xl border border-border">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 text-success" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">Walk-ins Welcome</h4>
                        <p className="text-sm text-muted-foreground">Accept customers without appointment</p>
                      </div>
                    </div>
                    <Switch
                      checked={badgeData.walk_in_welcome}
                      onCheckedChange={(checked) => setBadgeData({ ...badgeData, walk_in_welcome: checked })}
                    />
                  </div>
                </div>

                {/* Response Time */}
                <div className="space-y-2">
                  <Label htmlFor="response_time" className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    Average Response Time
                  </Label>
                  <Input
                    id="response_time"
                    value={badgeData.response_time}
                    onChange={(e) => setBadgeData({ ...badgeData, response_time: e.target.value })}
                    placeholder="e.g., 30-45 mins, 1-2 hours"
                  />
                  <p className="text-xs text-muted-foreground">
                    How quickly do you typically respond to quote requests?
                  </p>
                </div>

                <Button onClick={handleSaveBadges} disabled={isSavingBadges || !garage} className="w-full md:w-auto">
                  {isSavingBadges ? "Saving..." : "Save Badges"}
                </Button>

                {!garage && (
                  <p className="text-sm text-destructive">
                    Please save your garage profile first before managing badges.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews">
            <Card>
              <CardHeader>
                <CardTitle>Customer Reviews</CardTitle>
                <CardDescription>See what customers are saying about your garage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No reviews yet. Share your garage profile to get more reviews!</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Views</CardTitle>
                  <CardDescription>How many people viewed your garage profile</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={viewsData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "hsl(var(--card))", 
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px"
                          }} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="views" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          dot={{ fill: "hsl(var(--primary))" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Rating Trend</CardTitle>
                  <CardDescription>Your average rating over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ratingsData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                        <YAxis domain={[0, 5]} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "hsl(var(--card))", 
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px"
                          }} 
                        />
                        <Bar dataKey="rating" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Review Insights */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Review Insights</CardTitle>
                <CardDescription>What customers mention most often</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {["Quality Service", "Fair Pricing", "Friendly Staff", "Quick Turnaround", "Genuine Parts", "Clean Facility"].map((tag) => (
                    <div key={tag} className="px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
                      {tag}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Photos Tab */}
          <TabsContent value="photos">
            <Card>
              <CardHeader>
                <CardTitle>Photo Gallery</CardTitle>
                <CardDescription>Add photos of your garage to attract more customers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-border rounded-xl p-12 text-center">
                  <Image className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">Drag and drop photos here or click to upload</p>
                  <Button variant="outline">Upload Photos</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Upgrade Tab - Software Upsell */}
          <TabsContent value="upgrade">
            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">
                  Upgrade Your Garage With MeriGarage Management Software
                </CardTitle>
                <CardDescription className="text-lg">
                  Free to Start!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  <div className="flex items-start gap-3 p-4 bg-card rounded-xl border border-border">
                    <Wrench className="w-6 h-6 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground">Automate Daily Operations</h4>
                      <p className="text-sm text-muted-foreground">Effortlessly manage your garage workflow</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-card rounded-xl border border-border">
                    <Calendar className="w-6 h-6 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground">Manage Bookings & Invoices</h4>
                      <p className="text-sm text-muted-foreground">Customer history in one place</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-card rounded-xl border border-border">
                    <MessageSquare className="w-6 h-6 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground">Reduce No-Shows</h4>
                      <p className="text-sm text-muted-foreground">Automated reminders for customers</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-card rounded-xl border border-border">
                    <Users className="w-6 h-6 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground">Boost Customer Loyalty</h4>
                      <p className="text-sm text-muted-foreground">Service history & follow-ups</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-card rounded-xl border border-border">
                    <BarChart3 className="w-6 h-6 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground">Track Performance</h4>
                      <p className="text-sm text-muted-foreground">Revenue, profitability & staff metrics</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-card rounded-xl border border-border">
                    <Award className="w-6 h-6 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground">Works Everywhere</h4>
                      <p className="text-sm text-muted-foreground">Beautiful across all devices</p>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <a 
                    href="https://merigarage.com/GarageAdmin/login.php" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Button size="lg" className="text-lg px-8 h-14 gap-2">
                      👉 Try MeriGarage Software – Free
                      <ExternalLink className="w-5 h-5" />
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}
