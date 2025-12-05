import { Header } from "@/components/Header";
import { Phone, Mail, MapPin } from "lucide-react";

const Contact = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 bg-foreground">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-background mb-6">
            Contact Us
          </h1>
          <p className="text-xl text-background/80 max-w-3xl mx-auto">
            Get in touch with our team for any queries or support
          </p>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              {/* Phone */}
              <div className="bg-card rounded-2xl p-8 text-center shadow-lg border border-border">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Phone className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">Phone</h3>
                <a 
                  href="tel:+919582051155" 
                  className="text-lg text-muted-foreground hover:text-primary transition-colors"
                >
                  +91 9582051155
                </a>
              </div>

              {/* Email */}
              <div className="bg-card rounded-2xl p-8 text-center shadow-lg border border-border">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Mail className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">Email</h3>
                <a 
                  href="mailto:info@merigarage.com" 
                  className="text-lg text-muted-foreground hover:text-accent transition-colors"
                >
                  info@merigarage.com
                </a>
              </div>

              {/* Location */}
              <div className="bg-card rounded-2xl p-8 text-center shadow-lg border border-border">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MapPin className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">Locations</h3>
                <p className="text-lg text-muted-foreground">Delhi, India</p>
                <p className="text-lg text-muted-foreground">Dubai, UAE</p>
              </div>
            </div>

            {/* Additional Info */}
            <div className="bg-secondary/30 rounded-2xl p-8 text-center">
              <h3 className="text-2xl font-bold text-foreground mb-4">We'd Love to Hear From You</h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Whether you have questions about our platform, need support with your garage listing, or want to share feedback about your experience, our team is here to help. Reach out to us through any of the channels above.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
