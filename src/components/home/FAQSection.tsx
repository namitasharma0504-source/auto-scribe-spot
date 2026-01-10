import { useEffect } from "react";
import { HelpCircle, ChevronDown } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How do I find a trusted garage near me?",
    answer: "Use our search feature to find garages in your city. Filter by services, ratings, and reviews. Look for verified badges and read customer reviews to make an informed decision. Garages with higher ratings and more reviews are generally more reliable.",
  },
  {
    question: "Are the reviews on MeriGarage verified?",
    answer: "Yes, all reviews go through a moderation process. We verify that reviewers are genuine customers who visited the garage. Fake or spam reviews are removed to maintain authenticity and help you make better decisions.",
  },
  {
    question: "How can I write a review for a garage?",
    answer: "Simply click on 'Write a Review' button, enter the garage name and location, rate your experience from 1-5 stars, and share your detailed feedback. You'll earn 50 reward points for each verified review that gets approved.",
  },
  {
    question: "What are MeriGarage reward points?",
    answer: "Reward points are earned by writing verified reviews. You get 50 points per approved review. These points can be redeemed for discounts on car services, accessories, and other exciting rewards from partner garages.",
  },
  {
    question: "How can I list my garage on MeriGarage?",
    answer: "Click on 'List Your Garage' and fill out the registration form with your garage details including name, address, services offered, and contact information. Listing is completely free. Once verified, your garage will be visible to thousands of car owners.",
  },
  {
    question: "Can garage owners respond to reviews?",
    answer: "Yes, verified garage owners can respond to customer reviews through their dashboard. This helps build trust and shows customers that you value their feedback. Owners can also dispute unfair reviews through our moderation system.",
  },
  {
    question: "What services can I find on MeriGarage?",
    answer: "You can find garages offering general service, AC repair, body work, tyre services, engine diagnostics, EV servicing, denting and painting, wheel alignment, brake repair, and many more automotive services across India.",
  },
  {
    question: "Is MeriGarage available in my city?",
    answer: "MeriGarage is expanding rapidly across India. We currently have garages listed in major cities including Mumbai, Delhi, Bangalore, Chennai, Hyderabad, Pune, Kolkata, and many more. Search for your city to find available garages.",
  },
];

export function FAQSection() {
  // Inject JSON-LD schema for FAQs
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "faq-schema";
    
    const schemaData = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map((faq) => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer,
        },
      })),
    };
    
    script.textContent = JSON.stringify(schemaData);
    
    // Remove existing schema if present
    const existingScript = document.getElementById("faq-schema");
    if (existingScript) {
      existingScript.remove();
    }
    
    document.head.appendChild(script);
    
    return () => {
      const scriptToRemove = document.getElementById("faq-schema");
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, []);

  return (
    <section className="py-12 md:py-16 bg-gradient-to-b from-secondary/30 via-secondary/50 to-secondary/70 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4 shadow-sm">
            <HelpCircle className="w-4 h-4" />
            Got Questions?
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg">
            Find answers to common questions about finding garages, writing reviews, and using MeriGarage
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`faq-${index}`}
                className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl px-6 data-[state=open]:shadow-lg data-[state=open]:border-primary/20 transition-all duration-300 hover:border-primary/10"
              >
                <AccordionTrigger className="text-left hover:no-underline py-5">
                  <span className="font-medium text-foreground pr-4 text-base">
                    {faq.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="text-center mt-10 pt-8 border-t border-border/30">
          <div className="inline-flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
            <p className="text-muted-foreground">
              Still have questions?
            </p>
            <a 
              href="/contact" 
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-sm"
            >
              <HelpCircle className="w-4 h-4" />
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
