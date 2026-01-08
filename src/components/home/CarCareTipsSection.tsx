import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Calendar, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface BlogArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image: string | null;
  category: string | null;
  published_at: string | null;
  view_count: number | null;
  created_at: string;
}

export function CarCareTipsSection() {
  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["latest-blog-articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_articles")
        .select("id, title, slug, excerpt, featured_image, category, published_at, view_count, created_at")
        .eq("is_published", true)
        .order("published_at", { ascending: false })
        .limit(3);

      if (error) throw error;
      return data as BlogArticle[];
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
    });
  };

  // Fallback static content when no articles exist
  const staticTips = [
    {
      id: "1",
      title: "Summer AC Maintenance Tips",
      excerpt: "Keep your car's AC running efficiently in hot weather with these essential tips.",
      category: "car-care",
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
    },
    {
      id: "2",
      title: "When to Change Your Engine Oil",
      excerpt: "Understanding oil change intervals can save you money and extend engine life.",
      category: "maintenance",
      image: "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=400",
    },
    {
      id: "3",
      title: "Tire Care & Safety Guide",
      excerpt: "Proper tire maintenance ensures safety and improves fuel efficiency.",
      category: "safety",
      image: "https://images.unsplash.com/photo-1578844251758-2f71da64c96f?w=400",
    },
  ];

  return (
    <section className="py-16 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-10">
          <div>
            <div className="flex items-center gap-2 text-primary mb-2">
              <BookOpen className="w-5 h-5" />
              <span className="font-semibold">Expert Tips</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Car Care Tips
            </h2>
            <p className="text-muted-foreground mt-2">
              Keep your vehicle in top shape with our expert guides
            </p>
          </div>
          <Link to="/blog">
            <Button variant="ghost" className="gap-2 group">
              View All
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <Skeleton className="aspect-video" />
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-6 w-full mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : articles.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-6">
            {articles.map((article, index) => (
              <Link
                key={article.id}
                to={`/blog/${article.slug}`}
                className="group animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <Card className="h-full overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  {article.featured_image && (
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={article.featured_image}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary" className="text-xs capitalize">
                        {article.category?.replace("-", " ")}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {article.view_count || 0}
                      </span>
                    </div>
                    <h3 className="font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {article.excerpt}
                    </p>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(article.published_at || article.created_at)}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          // Fallback static content
          <div className="grid md:grid-cols-3 gap-6">
            {staticTips.map((tip, index) => (
              <Card
                key={tip.id}
                className="h-full overflow-hidden animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="aspect-video overflow-hidden">
                  <img
                    src={tip.image}
                    alt={tip.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <CardContent className="p-4">
                  <Badge variant="secondary" className="text-xs capitalize mb-3">
                    {tip.category?.replace("-", " ")}
                  </Badge>
                  <h3 className="font-semibold text-foreground mb-2">
                    {tip.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {tip.excerpt}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* CTA to Write Content */}
        {articles.length === 0 && (
          <div className="text-center mt-8">
            <p className="text-muted-foreground">
              More tips coming soon! Check back regularly for expert car care advice.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
