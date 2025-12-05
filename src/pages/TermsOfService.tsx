import { Header } from "@/components/Header";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="py-16 bg-foreground">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-background mb-4">
            Terms of Service
          </h1>
          <p className="text-background/80">Last updated: December 2024</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-card rounded-2xl p-8 md:p-12 shadow-lg border border-border">
            <div className="prose prose-lg max-w-none">
              <h2 className="text-2xl font-bold text-foreground mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground mb-6">
                By accessing and using MeriGarageReviews, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
              </p>

              <h2 className="text-2xl font-bold text-foreground mb-4">2. Use of Service</h2>
              <p className="text-muted-foreground mb-6">
                Our platform is free for both customers and garages. You agree to use the service only for lawful purposes and in accordance with these Terms. You are responsible for maintaining the confidentiality of your account credentials.
              </p>

              <h2 className="text-2xl font-bold text-foreground mb-4">3. User Reviews</h2>
              <p className="text-muted-foreground mb-6">
                Reviews submitted must be honest, accurate, and based on genuine experiences. We reserve the right to remove reviews that violate our guidelines, contain inappropriate content, or appear to be fraudulent.
              </p>

              <h2 className="text-2xl font-bold text-foreground mb-4">4. Intellectual Property</h2>
              <p className="text-muted-foreground mb-6">
                All content on this platform, including text, graphics, logos, and software, is the property of MeriGarage and is protected by intellectual property laws.
              </p>

              <h2 className="text-2xl font-bold text-foreground mb-4">5. Disclaimer</h2>
              <p className="text-muted-foreground mb-6">
                The reviews and ratings on our platform are user-generated. We do not guarantee the accuracy of any review or the quality of services provided by listed garages.
              </p>

              <h2 className="text-2xl font-bold text-foreground mb-4">6. Limitation of Liability</h2>
              <p className="text-muted-foreground mb-6">
                MeriGarage shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the service.
              </p>

              <h2 className="text-2xl font-bold text-foreground mb-4">7. Contact</h2>
              <p className="text-muted-foreground">
                For questions about these Terms, contact us at{" "}
                <a href="mailto:info@merigarage.com" className="text-primary hover:underline">
                  info@merigarage.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TermsOfService;
