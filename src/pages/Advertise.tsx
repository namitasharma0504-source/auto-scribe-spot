import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Megaphone, TrendingUp, Users, Eye, Target, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const Advertise = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary to-primary/80">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Megaphone className="w-12 h-12 text-primary-foreground" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
            Advertise on MeriGarage Reviews
          </h1>
          <p className="text-primary-foreground/90 max-w-2xl mx-auto text-lg mb-8">
            Reach thousands of car owners actively looking for garage services. Boost your visibility and grow your business.
          </p>
          <a href="mailto:info@merigarage.com?subject=Advertising Inquiry">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Get Started Today
            </Button>
          </a>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-primary">10K+</p>
              <p className="text-muted-foreground">Monthly Visitors</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-primary">6</p>
              <p className="text-muted-foreground">Countries Covered</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-primary">500+</p>
              <p className="text-muted-foreground">Garages Listed</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-primary">90%</p>
              <p className="text-muted-foreground">Mobile Users</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Advertise */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">
            Why Advertise With Us?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="text-center">
              <CardContent className="pt-8 pb-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground text-lg mb-2">Targeted Audience</h3>
                <p className="text-muted-foreground text-sm">
                  Reach car owners actively searching for garage services in your area. High-intent traffic that converts.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-8 pb-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Eye className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground text-lg mb-2">Premium Visibility</h3>
                <p className="text-muted-foreground text-sm">
                  Featured placements on search results, homepage, and garage listings. Stand out from the competition.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-8 pb-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground text-lg mb-2">Measurable Results</h3>
                <p className="text-muted-foreground text-sm">
                  Track impressions, clicks, and inquiries. Transparent reporting so you know your ROI.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Advertising Options */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">
            Advertising Options
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card className="border-2 border-transparent hover:border-primary transition-colors">
              <CardContent className="pt-6">
                <h3 className="font-bold text-foreground text-xl mb-3">Featured Listing</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Get your garage featured at the top of search results in your city. Includes a "Featured" badge.
                </p>
                <ul className="text-muted-foreground text-sm space-y-2">
                  <li>• Top placement in search</li>
                  <li>• Featured badge on listing</li>
                  <li>• Priority in "Near Me" results</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="border-2 border-transparent hover:border-primary transition-colors">
              <CardContent className="pt-6">
                <h3 className="font-bold text-foreground text-xl mb-3">Banner Ads</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Display your brand across our platform with eye-catching banner advertisements.
                </p>
                <ul className="text-muted-foreground text-sm space-y-2">
                  <li>• Homepage banners</li>
                  <li>• Search results page</li>
                  <li>• Garage detail pages</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="border-2 border-transparent hover:border-primary transition-colors">
              <CardContent className="pt-6">
                <h3 className="font-bold text-foreground text-xl mb-3">Sponsored Content</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Share your expertise through sponsored articles and garage spotlights.
                </p>
                <ul className="text-muted-foreground text-sm space-y-2">
                  <li>• Garage spotlight features</li>
                  <li>• Email newsletter mentions</li>
                  <li>• Social media promotion</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center bg-card rounded-2xl p-8 md:p-12 border border-border">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Ready to Grow Your Business?
            </h2>
            <p className="text-muted-foreground mb-8">
              Contact our advertising team today to discuss customized solutions for your garage or automotive business.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="mailto:info@merigarage.com?subject=Advertising Inquiry" className="flex items-center gap-2 text-primary hover:underline">
                <Mail className="w-5 h-5" />
                info@merigarage.com
              </a>
              <span className="text-muted-foreground hidden sm:inline">|</span>
              <a href="tel:+919582051155" className="flex items-center gap-2 text-primary hover:underline">
                <Phone className="w-5 h-5" />
                +91 9582051155
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Advertise;
