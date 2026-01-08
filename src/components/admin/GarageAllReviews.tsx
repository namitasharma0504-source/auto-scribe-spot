import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Edit, Save, X, Star, Loader2, User, Search, RefreshCw, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Review {
  id: string;
  user_id: string;
  rating: number;
  review_text: string | null;
  status: string | null;
  created_at: string;
  is_verified: boolean | null;
  garage_name: string;
  garage_id: string | null;
  customer_name: string | null;
  customer_display_name: string | null;
}

interface Garage {
  id: string;
  name: string;
}

export function GarageAllReviews() {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [garages, setGarages] = useState<Garage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGarageId, setSelectedGarageId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchGarages();
    fetchAllReviews();
  }, []);

  const fetchGarages = async () => {
    try {
      const { data, error } = await supabase
        .from("garages")
        .select("id, name")
        .order("name", { ascending: true });

      if (error) throw error;
      setGarages(data || []);
    } catch (error: any) {
      console.error("Error fetching garages:", error);
    }
  };

  const fetchAllReviews = async () => {
    setIsLoading(true);
    try {
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("user_reviews")
        .select("id, user_id, rating, review_text, status, created_at, is_verified, garage_name, garage_id, customer_display_name")
        .order("created_at", { ascending: false });

      if (reviewsError) throw reviewsError;

      if (!reviewsData || reviewsData.length === 0) {
        setReviews([]);
        return;
      }

      // Fetch customer names from profiles
      const userIds = [...new Set(reviewsData.map(r => r.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      const profileMap = new Map<string, string>();
      profilesData?.forEach(p => {
        if (p.full_name) profileMap.set(p.user_id, p.full_name);
      });

      const mappedReviews: Review[] = reviewsData.map(r => ({
        ...r,
        customer_name: profileMap.get(r.user_id) || null,
        customer_display_name: r.customer_display_name || null,
      }));

      setReviews(mappedReviews);
    } catch (error: any) {
      console.error("Error fetching reviews:", error);
      toast({
        title: "Error",
        description: "Failed to load reviews",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditName = (review: Review) => {
    setEditingId(review.id);
    setEditName(review.customer_display_name || review.customer_name || "");
  };

  const handleSaveName = async (review: Review) => {
    if (!editName.trim()) {
      toast({
        title: "Error",
        description: "Name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      // Update the customer_display_name on the review itself (not the profile)
      const { error } = await supabase
        .from("user_reviews")
        .update({ customer_display_name: editName.trim() })
        .eq("id", review.id);

      if (error) throw error;

      setReviews(prev =>
        prev.map(r =>
          r.id === review.id ? { ...r, customer_display_name: editName.trim() } : r
        )
      );

      toast({
        title: "Name Updated",
        description: "Customer name has been updated successfully",
      });

      setEditingId(null);
      setEditName("");
    } catch (error: any) {
      console.error("Error updating name:", error);
      toast({
        title: "Error",
        description: "Failed to update customer name",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/30">Approved</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">Pending</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/30">Rejected</Badge>;
      case "disputed":
        return <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/30">Disputed</Badge>;
      default:
        return <Badge variant="outline">{status || "Unknown"}</Badge>;
    }
  };

  // Filter reviews by garage and search query
  const filteredReviews = reviews.filter(review => {
    const matchesGarage = selectedGarageId === "all" || 
      review.garage_id === selectedGarageId || 
      review.garage_name === garages.find(g => g.id === selectedGarageId)?.name;
    
    const displayName = review.customer_display_name || review.customer_name;
    const matchesSearch = searchQuery === "" ||
      (displayName?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (review.review_text?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (review.garage_name?.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesGarage && matchesSearch;
  });

  // Group reviews by garage for display
  const reviewsByGarage = filteredReviews.reduce((acc, review) => {
    const garageName = review.garage_name || "Unknown Garage";
    if (!acc[garageName]) {
      acc[garageName] = [];
    }
    acc[garageName].push(review);
    return acc;
  }, {} as Record<string, Review[]>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Loading all reviews...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by customer name, review text, or garage..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedGarageId} onValueChange={setSelectedGarageId}>
          <SelectTrigger className="w-full sm:w-[280px]">
            <SelectValue placeholder="Filter by garage" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            <SelectItem value="all">All Garages</SelectItem>
            {garages.map((garage) => (
              <SelectItem key={garage.id} value={garage.id}>
                {garage.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={fetchAllReviews} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Reviews</p>
                <p className="text-xl font-bold">{filteredReviews.length}</p>
              </div>
              <Star className="w-6 h-6 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-600">Approved</p>
                <p className="text-xl font-bold text-green-600">
                  {filteredReviews.filter(r => r.status === "approved").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-yellow-600">Pending</p>
                <p className="text-xl font-bold text-yellow-600">
                  {filteredReviews.filter(r => r.status === "pending").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-orange-500/30 bg-orange-500/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-orange-600">Disputed</p>
                <p className="text-xl font-bold text-orange-600">
                  {filteredReviews.filter(r => r.status === "disputed").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reviews by Garage */}
      {Object.keys(reviewsByGarage).length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-8 pb-8">
            <div className="text-center">
              <Star className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No reviews found</p>
              <p className="text-sm text-muted-foreground/70">
                {selectedGarageId !== "all" ? "Try selecting a different garage" : "No reviews have been submitted yet"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(reviewsByGarage).map(([garageName, garageReviews]) => (
            <Card key={garageName}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  {garageName}
                  <Badge variant="secondary" className="ml-2">
                    {garageReviews.length} review{garageReviews.length !== 1 ? "s" : ""}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {garageReviews.map((review) => (
                  <div
                    key={review.id}
                    className="p-3 bg-muted/50 rounded-lg border space-y-2"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        {editingId === review.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="h-8 w-48"
                              placeholder="Enter customer name"
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSaveName(review)}
                              disabled={isSaving}
                              className="h-8 w-8 p-0"
                            >
                              {isSaving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Save className="w-4 h-4 text-green-600" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={cancelEdit}
                              className="h-8 w-8 p-0"
                            >
                              <X className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <span className="font-medium">
                              {review.customer_display_name || review.customer_name || "Unknown Customer"}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditName(review)}
                              className="h-6 w-6 p-0"
                            >
                              <Edit className="w-3 h-3 text-muted-foreground hover:text-primary" />
                            </Button>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < review.rating
                                  ? "text-yellow-500 fill-yellow-500"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        {getStatusBadge(review.status)}
                      </div>
                    </div>
                    {review.review_text && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {review.review_text}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(review.created_at), "MMM dd, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
