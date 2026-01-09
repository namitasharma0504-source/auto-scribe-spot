import { HelpCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { partnerFaqItems } from "@/data/partnerFaqData";
import { cn } from "@/lib/utils";

interface PartnerFAQSectionProps {
  showHeader?: boolean;
  className?: string;
}

export const PartnerFAQSection = ({ 
  showHeader = true, 
  className 
}: PartnerFAQSectionProps) => {
  return (
    <section className={cn("py-10", className)}>
      <div className="container mx-auto px-4">
        {showHeader && (
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
              <HelpCircle className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Got Questions?</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to know about becoming a MeriGarage Partner
            </p>
          </div>
        )}

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {partnerFaqItems.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-b border-border">
                <AccordionTrigger className="text-left font-medium text-foreground hover:text-primary py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};
