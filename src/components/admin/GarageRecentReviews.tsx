import { useState, useEffect } from "react";
import { format, subMonths } from "date-fns";
import { Edit, Save, X, Star, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  customer_name: string | null;
  customer_display_name: string | null;
}

interface GarageRecentReviewsProps {
  garageId: string;
  garageName: string;
}

export function GarageRecentReviews({ garageId, garageName }: GarageRecentReviewsProps) {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchRecentReviews();
  }, [garageId, garageName]);

  const fetchRecentReviews = async () => {
    setIsLoading(true);
    try {
      const oneMonthAgo = subMonths(new Date(), 1).toISOString();

      // Fetch reviews for this garage from last month
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("user_reviews")
        .select("id, user_id, rating, review_text, status, created_at, is_verified, customer_display_name")
        .or(`garage_id.eq.${garageId},garage_name.eq.${garageName}`)
        .gte("created_at", oneMonthAgo)
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
      console.error("Error fetching recent reviews:", error);
      toast({
        title: "Error",
        description: "Failed to load recent reviews",
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

      // Update local state
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading reviews...</span>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No reviews in the last month</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-500" />
          Recent Reviews (Last 30 Days) - {reviews.length} review{reviews.length !== 1 ? "s" : ""}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {reviews.map((review) => (
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
  );
}
