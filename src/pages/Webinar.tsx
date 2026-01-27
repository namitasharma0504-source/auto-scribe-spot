import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Calendar, Clock, CalendarCheck, Sparkles, Mail, PartyPopper, AlertCircle, RefreshCw } from "lucide-react";
import confetti from "canvas-confetti";
import { Link } from "react-router-dom";
import { format } from "date-fns";

interface WebinarSlot {
  id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  is_full: boolean;
  max_capacity: number | null;
}

const Webinar = () => {
  const [email, setEmail] = useState("");
  const [isBooking, setIsBooking] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [bookedSlot, setBookedSlot] = useState<string | null>(null);
  const [webinarSlots, setWebinarSlots] = useState<WebinarSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWebinarSlots = async () => {
      setIsLoadingSlots(true);
      try {
        const { data, error } = await supabase
          .from("webinar_slots")
          .select("*")
          .order("slot_date", { ascending: true })
          .limit(2);

        if (error) throw error;
        setWebinarSlots(data || []);
      } catch (error) {
        console.error("Error fetching webinar slots:", error);
        toast.error("Failed to load webinar slots");
      } finally {
        setIsLoadingSlots(false);
      }
    };

    fetchWebinarSlots();
  }, []);

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const triggerConfetti = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7"],
      });
    }, 150);
  };

  const handleBookSlot = async (slotId: string) => {
    setEmailError(null);
    
    if (!email.trim()) {
      setEmailError("Please enter your email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setEmailError("Please enter a valid email address");
      return;
    }

    setIsBooking(true);
    setSelectedSlot(slotId);
    
    try {
      const { data, error } = await supabase.functions.invoke("book-webinar", {
        body: { action: "book", email: email.trim().toLowerCase(), slot: slotId },
      });

      if (error) throw error;

      if (!data.success) {
        if (data.notFound) {
          setEmailError("No partner application found with this email. Please apply first before booking a webinar slot.");
        } else {
          toast.error(data.error || "Failed to book slot");
        }
        return;
      }

      setBookedSlot(slotId);
      setBookingComplete(true);
      triggerConfetti();
      toast.success("Webinar slot booked successfully!");
    } catch (error: any) {
      console.error("Error booking slot:", error);
      toast.error(error.message || "Failed to book slot. Please try again.");
    } finally {
      setIsBooking(false);
      setSelectedSlot(null);
    }
  };

  const getSlotDetails = (slotId: string) => {
    const slot = webinarSlots.find((s) => s.slot_date === slotId);
    if (!slot) return null;
    
    const slotDate = new Date(slot.slot_date);
    return {
      id: slot.slot_date,
      dayName: format(slotDate, "EEEE"),
      displayDate: format(slotDate, "do MMMM yyyy"),
      time: `${formatTime(slot.start_time)} - ${formatTime(slot.end_time)}`,
    };
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
            <Card className="border-green-500/30 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 overflow-hidden">
              <CardContent className="p-8 md:p-12 text-center relative">
                {/* Celebration decorations */}
                <div className="absolute top-4 left-4">
                  <Sparkles className="w-6 h-6 text-yellow-500 animate-pulse" />
                </div>
                <div className="absolute top-4 right-4">
                  <Sparkles className="w-6 h-6 text-yellow-500 animate-pulse" />
                </div>
                
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-bounce">
                  <PartyPopper className="w-10 h-10 text-white" />
                </div>
                
                <h2 className="text-2xl md:text-3xl font-bold text-green-600 mb-3">
                  Thank You for Booking Your Webinar!
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  You will receive joining details on your email.
                </p>

                <div className="bg-white dark:bg-card rounded-xl p-6 max-w-sm mx-auto shadow-md border">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                      <CalendarCheck className="w-7 h-7 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-lg text-foreground">
                        {getSlotDetails(bookedSlot)?.dayName}
                      </p>
                      <p className="text-muted-foreground">
                        {getSlotDetails(bookedSlot)?.displayDate}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground bg-secondary/50 rounded-lg px-4 py-2">
                    <Clock className="w-4 h-4" />
                    <span>{getSlotDetails(bookedSlot)?.time}</span>
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span>Check your inbox for confirmation email</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Slot Selection State */}
          {!bookingComplete && (
            <div className="space-y-8">
              {/* Email Input */}
              <Card className="bg-card">
                <CardContent className="p-6">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Enter the email you used for your partner application
                  </label>
                  <Input
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError(null);
                    }}
                    className={`text-base ${emailError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  />
                  {emailError && (
                    <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <div className="flex items-start gap-2 text-red-600 dark:text-red-400">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <p>{emailError}</p>
                          {emailError.includes("apply first") && (
                            <Link 
                              to="/partner-apply" 
                              className="inline-block mt-2 font-medium underline hover:no-underline"
                            >
                              Apply now →
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    We'll send the webinar joining details to this email
                  </p>
                </CardContent>
              </Card>

              {/* Available Slots */}
              <div>
                <h2 className="text-xl font-semibold text-center mb-6">
                  Choose Your Preferred Date
                </h2>
                {isLoadingSlots ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : webinarSlots.length === 0 ? (
                  <Card className="py-12">
                    <CardContent className="text-center">
                      <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No webinar slots available at the moment</p>
                      <p className="text-sm text-muted-foreground mt-1">Please check back later</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {webinarSlots.map((slot) => {
                      const slotDate = new Date(slot.slot_date);
                      const dayName = format(slotDate, "EEEE");
                      const displayDate = format(slotDate, "do MMMM yyyy");
                      const timeDisplay = `${formatTime(slot.start_time)} - ${formatTime(slot.end_time)}`;
                      
                      return (
                        <Card
                          key={slot.id}
                          className={`transition-all border-2 ${
                            slot.is_full 
                              ? "opacity-60 cursor-not-allowed border-muted" 
                              : "hover:border-primary/50 hover:shadow-lg cursor-pointer group"
                          }`}
                        >
                          <CardContent className="p-6 text-center">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-transform ${
                              slot.is_full 
                                ? "bg-muted" 
                                : "bg-gradient-to-br from-primary/20 to-primary/10 group-hover:scale-110"
                            }`}>
                              <Calendar className={`w-8 h-8 ${slot.is_full ? "text-muted-foreground" : "text-primary"}`} />
                            </div>
                            <h3 className="text-xl font-semibold text-foreground mb-1">
                              {dayName}
                            </h3>
                            <p className="text-muted-foreground mb-3">{displayDate}</p>
                            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 rounded-full px-4 py-2 mb-5">
                              <Clock className="w-4 h-4" />
                              <span>{timeDisplay}</span>
                            </div>
                            {slot.is_full ? (
                              <div className="w-full h-12 flex items-center justify-center bg-muted rounded-md text-muted-foreground font-medium">
                                Slot Full
                              </div>
                            ) : (
                              <Button
                                onClick={() => handleBookSlot(slot.slot_date)}
                                disabled={isBooking}
                                className="w-full h-12 text-base"
                                size="lg"
                              >
                                {isBooking && selectedSlot === slot.slot_date ? (
                                  <span className="flex items-center gap-2">
                                    <span className="animate-spin">⏳</span>
                                    Booking...
                                  </span>
                                ) : (
                                  "Book This Slot"
                                )}
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
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
