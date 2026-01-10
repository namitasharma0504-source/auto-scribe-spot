import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Calendar, Clock, CheckCircle, Mail, User, ArrowRight, CalendarCheck } from "lucide-react";
import { format } from "date-fns";

interface ApplicationData {
  id: string;
  full_name: string;
  email: string;
  webinar_slot: string | null;
  webinar_booked_at: string | null;
}

const WEBINAR_SLOTS = [
  {
    id: "2026-01-17",
    date: new Date(2026, 0, 17, 16, 0),
    dayName: "Friday",
    displayDate: "17th January 2026",
    time: "4:00 PM - 5:00 PM",
  },
  {
    id: "2026-01-18",
    date: new Date(2026, 0, 18, 16, 0),
    dayName: "Saturday",
    displayDate: "18th January 2026",
    time: "4:00 PM - 5:00 PM",
  },
];

const Webinar = () => {
  const [email, setEmail] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [bookedSlot, setBookedSlot] = useState<string | null>(null);

  const handleVerifyEmail = async () => {
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    setIsVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke("book-webinar", {
        body: { action: "lookup", email: email.trim().toLowerCase() },
      });

      if (error) throw error;

      if (!data.found) {
        toast.error("No application found with this email. Please use the email you used for your partner application.");
        return;
      }

      setApplication(data.application);

      if (data.application.webinar_slot) {
        setBookedSlot(data.application.webinar_slot);
        setBookingComplete(true);
      }
    } catch (error: any) {
      console.error("Error verifying email:", error);
      toast.error(error.message || "Failed to verify email. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleBookSlot = async (slotId: string) => {
    if (!application) return;

    setIsBooking(true);
    try {
      const { data, error } = await supabase.functions.invoke("book-webinar", {
        body: { action: "book", email: application.email, slot: slotId },
      });

      if (error) throw error;

      if (!data.success) {
        toast.error(data.error || "Failed to book slot");
        return;
      }

      setBookedSlot(slotId);
      setBookingComplete(true);
      toast.success("Webinar slot booked successfully!");
    } catch (error: any) {
      console.error("Error booking slot:", error);
      toast.error(error.message || "Failed to book slot. Please try again.");
    } finally {
      setIsBooking(false);
    }
  };

  const getSlotDetails = (slotId: string) => {
    return WEBINAR_SLOTS.find((s) => s.id === slotId);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-grow py-12 px-4">
        <div className="container max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Calendar className="w-4 h-4" />
              Partner Orientation Webinar
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Book Your Webinar Slot
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Join us for an exclusive orientation webinar to learn about earning opportunities, 
              training resources, and how to get started as a MeriGarage Partner.
            </p>
          </div>

          {/* Booking Complete State */}
          {bookingComplete && bookedSlot && (
            <Card className="border-green-500/30 bg-green-500/5">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CalendarCheck className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-green-600 mb-2">
                  Webinar Booked!
                </h2>
                <p className="text-muted-foreground mb-6">
                  Hi <strong>{application?.full_name}</strong>, your slot has been confirmed.
                </p>

                <div className="bg-white rounded-xl p-6 max-w-sm mx-auto shadow-sm border">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-foreground">
                        {getSlotDetails(bookedSlot)?.dayName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {getSlotDetails(bookedSlot)?.displayDate}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{getSlotDetails(bookedSlot)?.time}</span>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mt-6">
                  You will receive a reminder email with the webinar link before the session.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Email Verification State */}
          {!application && !bookingComplete && (
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <Mail className="w-5 h-5" />
                  Verify Your Application
                </CardTitle>
                <CardDescription>
                  Enter the email you used for your partner application
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleVerifyEmail()}
                    className="flex-1"
                  />
                  <Button onClick={handleVerifyEmail} disabled={isVerifying} className="gap-2">
                    {isVerifying ? (
                      <>
                        <span className="animate-spin">⏳</span>
                        Verifying...
                      </>
                    ) : (
                      <>
                        Verify
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Don't have an application yet?{" "}
                  <a href="/partner-apply" className="text-primary hover:underline">
                    Apply now
                  </a>
                </p>
              </CardContent>
            </Card>
          )}

          {/* Slot Selection State */}
          {application && !bookingComplete && (
            <div className="space-y-6">
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{application.full_name}</p>
                    <p className="text-sm text-muted-foreground">{application.email}</p>
                  </div>
                  <Badge className="ml-auto bg-green-500/10 text-green-600 border-green-500/30">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                </CardContent>
              </Card>

              <div>
                <h2 className="text-xl font-semibold text-center mb-6">
                  Select Your Preferred Slot
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {WEBINAR_SLOTS.map((slot) => (
                    <Card
                      key={slot.id}
                      className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group"
                    >
                      <CardContent className="p-6 text-center">
                        <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                          <Calendar className="w-7 h-7 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-1">
                          {slot.dayName}
                        </h3>
                        <p className="text-muted-foreground mb-2">{slot.displayDate}</p>
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4">
                          <Clock className="w-4 h-4" />
                          <span>{slot.time}</span>
                        </div>
                        <Button
                          onClick={() => handleBookSlot(slot.id)}
                          disabled={isBooking}
                          className="w-full"
                        >
                          {isBooking ? "Booking..." : "Book This Slot"}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Info Section */}
          <div className="mt-12 grid md:grid-cols-3 gap-6 text-center">
            <div className="p-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">📚</span>
              </div>
              <h3 className="font-semibold text-foreground mb-1">Training Overview</h3>
              <p className="text-sm text-muted-foreground">
                Learn about our comprehensive training program
              </p>
            </div>
            <div className="p-4">
              <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="font-semibold text-foreground mb-1">Earning Opportunities</h3>
              <p className="text-sm text-muted-foreground">
                Discover how to earn ₹10K-50K+ monthly
              </p>
            </div>
            <div className="p-4">
              <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🤝</span>
              </div>
              <h3 className="font-semibold text-foreground mb-1">Q&A Session</h3>
              <p className="text-sm text-muted-foreground">
                Get all your questions answered live
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Webinar;
