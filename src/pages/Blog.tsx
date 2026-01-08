import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Calendar, User, Eye, Tag, ArrowRight, BookOpen } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

interface BlogArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featured_image: string | null;
  video_url: string | null;
  category: string | null;
  tags: string[] | null;
  published_at: string | null;
  author_name: string | null;
  view_count: number | null;
  created_at: string;
}

const categories = [
  { value: "all", label: "All" },
  { value: "car-care", label: "Car Care Tips" },
  { value: "maintenance", label: "Maintenance" },
  { value: "diy", label: "DIY Fixes" },
  { value: "buying-guide", label: "Buying Guide" },
  { value: "safety", label: "Safety" },
];

export default function Blog() {
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    const fetchArticles = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("blog_articles")
          .select("*")
          .eq("is_published", true)
          .order("published_at", { ascending: false });

        if (error) throw error;
        setArticles(data || []);
      } catch (error) {
        console.error("Error fetching articles:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticles();
  }, []);

  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (article.excerpt || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-16">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <BookOpen className="w-4 h-4" />
                Car Care Blog
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                Car Care Tips & Guides
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Expert advice on car maintenance, DIY tips, and everything you need to keep your vehicle in top shape.
              </p>
              
              {/* Search */}
              <div className="relative max-w-xl mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 text-lg"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Category Filter */}
        <section className="border-b">
          <div className="container mx-auto px-4">
            <div className="flex gap-2 py-4 overflow-x-auto">
              {categories.map((cat) => (
                <Button
                  key={cat.value}
                  variant={selectedCategory === cat.value ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.value)}
                  className="whitespace-nowrap"
                >
                  {cat.label}
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* Articles Grid */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            {isLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i}>
                    <Skeleton className="aspect-video" />
                    <CardContent className="p-4">
                      <Skeleton className="h-4 w-20 mb-2" />
                      <Skeleton className="h-6 w-full mb-2" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4 mt-1" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="text-center py-16">
                <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-2">No articles found</h2>
                <p className="text-muted-foreground mb-6">
                  {searchQuery
                    ? "Try adjusting your search terms"
                    : "Check back soon for new content!"}
                </p>
                {searchQuery && (
                  <Button variant="outline" onClick={() => setSearchQuery("")}>
                    Clear Search
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Featured Article */}
                {filteredArticles.length > 0 && (
                  <Link to={`/blog/${filteredArticles[0].slug}`}>
                    <Card className="mb-8 overflow-hidden hover:shadow-xl transition-shadow group">
                      <div className="grid md:grid-cols-2">
                        {filteredArticles[0].featured_image && (
                          <div className="aspect-video md:aspect-auto overflow-hidden">
                            <img
                              src={filteredArticles[0].featured_image}
                              alt={filteredArticles[0].title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        )}
                        <CardContent className="p-6 md:p-8 flex flex-col justify-center">
                          <Badge className="w-fit mb-4">{filteredArticles[0].category}</Badge>
                          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4 group-hover:text-primary transition-colors">
                            {filteredArticles[0].title}
                          </h2>
                          <p className="text-muted-foreground mb-4 line-clamp-3">
                            {filteredArticles[0].excerpt}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {filteredArticles[0].author_name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatDate(filteredArticles[0].published_at || filteredArticles[0].created_at)}
                            </span>
                          </div>
                        </CardContent>
                      </div>
                    </Card>
                  </Link>
                )}

                {/* Rest of Articles */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredArticles.slice(1).map((article) => (
                    <Link key={article.id} to={`/blog/${article.slug}`}>
                      <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow group">
                        {article.featured_image && (
                          <div className="aspect-video overflow-hidden">
                            <img
                              src={article.featured_image}
                              alt={article.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        )}
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Badge variant="secondary" className="text-xs">
                              {article.category}
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
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{article.author_name}</span>
                            <span>
                              {formatDate(article.published_at || article.created_at)}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Looking for a Trusted Garage?</h2>
            <p className="text-lg opacity-90 mb-6 max-w-2xl mx-auto">
              Find verified garages near you with honest reviews from real customers.
            </p>
            <Link to="/search">
              <Button size="lg" variant="secondary" className="gap-2">
                Find Garages
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
