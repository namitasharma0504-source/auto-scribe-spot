import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PartnerFAQSection } from "@/components/PartnerFAQSection";
import partnerWorkFromHome from "@/assets/partner-work-from-home.jpg";
import partnerDataCollection from "@/assets/partner-data-collection.jpg";
import partnerEarnings from "@/assets/partner-earnings.jpg";
import { 
  Users, 
  Camera, 
  TrendingUp, 
  Laptop, 
  Clock, 
  Wallet, 
  CheckCircle2, 
  ArrowRight,
  Phone,
  Mail,
  Building2,
  Target,
  Star,
  Handshake,
  IndianRupee,
  FileCheck,
  GraduationCap,
  Headphones,
  BookOpen,
  Award,
  Quote,
  Zap,
  Shield,
  TrendingDown,
  MessageCircle,
  Heart,
  Briefcase,
  Globe,
  BadgeCheck,
  CalendarCheck,
  Banknote
} from "lucide-react";


const testimonials = [
  {
    name: "Rajesh Kumar",
    location: "Delhi",
    role: "Data Collection Partner",
    quote: "I started as a student looking for part-time income. Now I earn ₹15,000+ monthly just by adding garages in my area. The best part? I work on my own schedule!",
    earnings: "₹15,000/month",
    avatar: "RK"
  },
  {
    name: "Priya Sharma",
    location: "Mumbai",
    role: "Sales Partner",
    quote: "After my maternity break, I was looking for work-from-home options. MeriGarage Partner Program changed everything. I've closed 8 deals in 3 months!",
    earnings: "₹35,000/month",
    avatar: "PS"
  },
  {
    name: "Amit Verma",
    location: "Bangalore",
    role: "Top Performer",
    quote: "I was skeptical at first, but the training and support team made it easy. Now I'm one of the top partners, earning both from data collection and software sales.",
    earnings: "₹50,000+/month",
    avatar: "AV"
  }
];

const Partners = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section - Compact */}
      <section className="relative py-12 md:py-16 bg-gradient-to-br from-primary/10 via-background to-accent/10 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23000%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-3 bg-primary/10 text-primary border-primary/20">
              <Handshake className="w-3 h-3 mr-1" />
              Partner Program
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Become a <span className="text-primary">MeriGarage Partner</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
              Work from home, earn daily. Join India's largest garage discovery platform and earn <span className="text-primary font-semibold">₹10,000 - ₹50,000+</span> monthly.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mb-6">
              <div className="flex items-center gap-2 bg-card px-3 py-1.5 rounded-full shadow-sm text-sm">
                <Laptop className="w-4 h-4 text-primary" />
                <span className="font-medium">Work From Home</span>
              </div>
              <div className="flex items-center gap-2 bg-card px-3 py-1.5 rounded-full shadow-sm text-sm">
                <Clock className="w-4 h-4 text-accent" />
                <span className="font-medium">Flexible Hours</span>
              </div>
              <div className="flex items-center gap-2 bg-card px-3 py-1.5 rounded-full shadow-sm text-sm">
                <Wallet className="w-4 h-4 text-success" />
                <span className="font-medium">Daily Earnings</span>
              </div>
              <div className="flex items-center gap-2 bg-card px-3 py-1.5 rounded-full shadow-sm text-sm">
                <TrendingDown className="w-4 h-4 text-warning" />
                <span className="font-medium">Zero Investment</span>
              </div>
            </div>
            <Button 
              size="lg" 
              className="text-lg px-8"
              asChild
            >
              <Link to="/partner-apply">
                Apply Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Banner */}
      <section className="py-6 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl md:text-3xl font-bold">500+</div>
              <div className="text-sm opacity-90">Active Partners</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold">28</div>
              <div className="text-sm opacity-90">States Covered</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold">₹15L+</div>
              <div className="text-sm opacity-90">Paid to Partners</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold">50K+</div>
              <div className="text-sm opacity-90">Garages Added</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Compact */}
      <section className="py-10 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">How It Works</h2>
            <p className="text-muted-foreground">Simple 3-step process to start earning</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="text-center bg-background rounded-xl p-6 shadow-sm">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileCheck className="w-7 h-7 text-primary" />
              </div>
              <div className="text-xl font-bold text-primary mb-1">Step 1</div>
              <h3 className="text-lg font-semibold text-foreground mb-1">Apply Online</h3>
              <p className="text-muted-foreground text-sm">Fill the form below - takes just 2 minutes</p>
            </div>
            <div className="text-center bg-background rounded-xl p-6 shadow-sm">
              <div className="w-14 h-14 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-7 h-7 text-accent" />
              </div>
              <div className="text-xl font-bold text-accent mb-1">Step 2</div>
              <h3 className="text-lg font-semibold text-foreground mb-1">Quick Interview</h3>
              <p className="text-muted-foreground text-sm">5-minute call to understand your availability</p>
            </div>
            <div className="text-center bg-background rounded-xl p-6 shadow-sm">
              <div className="w-14 h-14 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Zap className="w-7 h-7 text-success" />
              </div>
              <div className="text-xl font-bold text-success mb-1">Step 3</div>
              <h3 className="text-lg font-semibold text-foreground mb-1">Start Earning</h3>
              <p className="text-muted-foreground text-sm">Get trained and start earning from day 1</p>
            </div>
          </div>
        </div>
      </section>

      {/* Earning Opportunities - With Amounts */}
      <section className="py-10 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Earning Opportunities</h2>
            <p className="text-muted-foreground">Three ways to maximize your income</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {/* Task 1: Data Collection */}
            <Card className="relative overflow-hidden hover:shadow-lg transition-shadow border-2 hover:border-primary/30">
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-semibold rounded-bl-lg">
                Daily Pay
              </div>
              <CardHeader className="pb-3">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-2">
                  <Camera className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Data Collection</CardTitle>
                <CardDescription>Build India's garage database</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    <span>Collect garage visiting cards</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    <span>Upload photos & location</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    <span>Add garage details online</span>
                  </li>
                </ul>
                <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Per Garage</span>
                    <span className="text-lg font-bold text-primary">₹15 - ₹50</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Add 20+ garages/day = ₹15,000+/month</div>
                </div>
              </CardContent>
            </Card>

            {/* Task 2: Reputation Sales */}
            <Card className="relative overflow-hidden hover:shadow-lg transition-shadow border-2 hover:border-accent/30">
              <div className="absolute top-0 right-0 bg-accent text-accent-foreground px-3 py-1 text-xs font-semibold rounded-bl-lg">
                Commission
              </div>
              <CardHeader className="pb-3">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-2">
                  <TrendingUp className="w-6 h-6 text-accent" />
                </div>
                <CardTitle className="text-lg">Reputation Sales</CardTitle>
                <CardDescription>Sell listing subscriptions</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    <span>Pitch to garage owners</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    <span>Help claim their listing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    <span>Close subscription deals</span>
                  </li>
                </ul>
                <div className="bg-accent/5 rounded-lg p-3 border border-accent/20">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Per Sale</span>
                    <span className="text-lg font-bold text-accent">₹500 - ₹2,000</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Close 10 deals/month = ₹10,000+</div>
                </div>
              </CardContent>
            </Card>

            {/* Task 3: GMS Sales */}
            <Card className="relative overflow-hidden hover:shadow-lg transition-shadow border-2 hover:border-success/30 ring-2 ring-success/20">
              <div className="absolute top-0 right-0 bg-success text-white px-3 py-1 text-xs font-semibold rounded-bl-lg">
                High Earnings
              </div>
              <CardHeader className="pb-3">
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mb-2">
                  <Building2 className="w-6 h-6 text-success" />
                </div>
                <CardTitle className="text-lg">GMS Software Sales</CardTitle>
                <CardDescription>Sell garage management system</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    <span>Demo software to owners</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    <span>Help with onboarding</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    <span>Close software deals</span>
                  </li>
                </ul>
                <div className="bg-success/5 rounded-lg p-3 border border-success/20">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Per Sale</span>
                    <span className="text-lg font-bold text-success">₹5,000 - ₹15,000</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Close 3 deals/month = ₹30,000+</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Partner Testimonials */}
      <section className="py-10 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Partner Success Stories</h2>
            <p className="text-muted-foreground">Hear from our top-performing partners</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="relative">
                <CardContent className="pt-6">
                  <Quote className="w-8 h-8 text-primary/20 absolute top-4 right-4" />
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">{testimonial.name}</div>
                      <div className="text-xs text-muted-foreground">{testimonial.role} • {testimonial.location}</div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 italic">"{testimonial.quote}"</p>
                  <div className="flex items-center gap-2 text-success font-semibold">
                    <IndianRupee className="w-4 h-4" />
                    <span>Earning: {testimonial.earnings}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Training & Support */}
      <section className="py-10 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Training & Support</h2>
            <p className="text-muted-foreground">Everything you need to succeed</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            <div className="bg-card rounded-xl p-5 text-center shadow-sm">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <GraduationCap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Free Training</h3>
              <p className="text-sm text-muted-foreground">Comprehensive onboarding with video tutorials and live sessions</p>
            </div>
            <div className="bg-card rounded-xl p-5 text-center shadow-sm">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Sales Materials</h3>
              <p className="text-sm text-muted-foreground">Ready-to-use scripts, presentations, and marketing collaterals</p>
            </div>
            <div className="bg-card rounded-xl p-5 text-center shadow-sm">
              <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Headphones className="w-6 h-6 text-success" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">WhatsApp Support</h3>
              <p className="text-sm text-muted-foreground">Dedicated support team available 7 days a week</p>
            </div>
            <div className="bg-card rounded-xl p-5 text-center shadow-sm">
              <div className="w-12 h-12 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Award className="w-6 h-6 text-warning" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Partner Dashboard</h3>
              <p className="text-sm text-muted-foreground">Track tasks, earnings, and performance in real-time</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Join - Enhanced with Photos */}
      <section className="py-10 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Why Join MeriGarage?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">More than just a gig - it's your pathway to financial freedom and professional growth</p>
          </div>
          
          {/* Photo + Benefits Grid */}
          <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto mb-10">
            {/* Left - Photo Showcase */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="rounded-xl overflow-hidden shadow-lg">
                  <img src={partnerWorkFromHome} alt="Partner working from home" className="w-full h-48 object-cover object-top" />
                </div>
                <div className="bg-primary text-primary-foreground rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold">₹50K+</div>
                  <div className="text-sm opacity-90">Top Partner Earnings</div>
                </div>
              </div>
              <div className="space-y-4 mt-6">
                <div className="rounded-xl overflow-hidden shadow-lg">
                  <img src={partnerDataCollection} alt="Data collection in field" className="w-full h-48 object-cover object-top" />
                </div>
                <div className="rounded-xl overflow-hidden shadow-lg">
                  <img src={partnerEarnings} alt="Partner celebrating earnings" className="w-full h-48 object-cover object-top" />
                </div>
              </div>
            </div>
            
            {/* Right - Benefits List */}
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-background rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Laptop className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">100% Work From Home</h3>
                  <p className="text-sm text-muted-foreground">No commute, no office politics. Work from your home, a café, or anywhere with internet. Your laptop is your office.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-4 bg-background rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Complete Schedule Freedom</h3>
                  <p className="text-sm text-muted-foreground">Morning person? Night owl? Work 2 hours or 10 hours - you decide. Perfect alongside studies, job, or family responsibilities.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-4 bg-background rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Banknote className="w-6 h-6 text-success" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Daily Payments + Commissions</h3>
                  <p className="text-sm text-muted-foreground">Get paid daily for data tasks via UPI. Plus earn handsome commissions on every sale you close. No waiting for month-end!</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-4 bg-background rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-warning/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Zero Investment Required</h3>
                  <p className="text-sm text-muted-foreground">No registration fees, no security deposits, no hidden charges. Just your smartphone and dedication - that's all you need to start.</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Additional Benefits Row */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            <div className="text-center p-4 bg-background rounded-xl shadow-sm">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <GraduationCap className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground text-sm mb-1">No Experience Needed</h3>
              <p className="text-xs text-muted-foreground">We provide complete training from scratch</p>
            </div>
            <div className="text-center p-4 bg-background rounded-xl shadow-sm">
              <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <Globe className="w-5 h-5 text-accent" />
              </div>
              <h3 className="font-semibold text-foreground text-sm mb-1">Pan-India Opportunity</h3>
              <p className="text-xs text-muted-foreground">Work from any city, town or village in India</p>
            </div>
            <div className="text-center p-4 bg-background rounded-xl shadow-sm">
              <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <BadgeCheck className="w-5 h-5 text-success" />
              </div>
              <h3 className="font-semibold text-foreground text-sm mb-1">Certified Partner Status</h3>
              <p className="text-xs text-muted-foreground">Get official MeriGarage partner certificate</p>
            </div>
            <div className="text-center p-4 bg-background rounded-xl shadow-sm">
              <div className="w-10 h-10 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <Briefcase className="w-5 h-5 text-warning" />
              </div>
              <h3 className="font-semibold text-foreground text-sm mb-1">Career Growth Path</h3>
              <p className="text-xs text-muted-foreground">Grow to Team Lead, City Head roles</p>
            </div>
          </div>
        </div>
      </section>

      {/* Who Can Join Banner */}
      <section className="py-8 bg-gradient-to-r from-primary/10 via-accent/10 to-success/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-foreground mb-2">Perfect For</h3>
          </div>
          <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
            <Badge variant="secondary" className="px-4 py-2 text-sm">
              <GraduationCap className="w-4 h-4 mr-2" />
              College Students
            </Badge>
            <Badge variant="secondary" className="px-4 py-2 text-sm">
              <Heart className="w-4 h-4 mr-2" />
              Homemakers
            </Badge>
            <Badge variant="secondary" className="px-4 py-2 text-sm">
              <Briefcase className="w-4 h-4 mr-2" />
              Working Professionals
            </Badge>
            <Badge variant="secondary" className="px-4 py-2 text-sm">
              <Target className="w-4 h-4 mr-2" />
              Job Seekers
            </Badge>
            <Badge variant="secondary" className="px-4 py-2 text-sm">
              <Clock className="w-4 h-4 mr-2" />
              Retired Professionals
            </Badge>
            <Badge variant="secondary" className="px-4 py-2 text-sm">
              <Users className="w-4 h-4 mr-2" />
              Freelancers
            </Badge>
            <Badge variant="secondary" className="px-4 py-2 text-sm">
              <CalendarCheck className="w-4 h-4 mr-2" />
              Part-time Workers
            </Badge>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <PartnerFAQSection className="bg-background" />

      {/* Application CTA Section */}
      <section id="apply" className="py-10 bg-card">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Ready to Start Earning?</h2>
            <p className="text-muted-foreground mb-6">
              Join 500+ partners already earning with MeriGarage. Apply now - it's 100% free!
            </p>
            <Button 
              size="lg" 
              className="text-lg px-8"
              asChild
            >
              <Link to="/partner-apply">
                Apply for Partner Program
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Banner */}
      <section className="py-8 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-4xl mx-auto">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-8 h-8" />
              <div>
                <div className="font-semibold">Have Questions?</div>
                <div className="text-sm opacity-90">We're here to help you get started</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <a href="tel:+919310745153" className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg hover:bg-white/20 transition-colors">
                <Phone className="w-4 h-4" />
                <span>+91 93107 45153</span>
              </a>
              <a href="mailto:partners@merigarage.com" className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg hover:bg-white/20 transition-colors">
                <Mail className="w-4 h-4" />
                <span>Email Us</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Partners;
