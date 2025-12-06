import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Shield, CheckCircle, Users, Lock, AlertTriangle, Eye } from "lucide-react";

const TrustSafety = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      {/* Hero Section */}
      <section className="py-16 bg-foreground">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="w-10 h-10 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold text-background">
              Trust & Safety
            </h1>
          </div>
          <p className="text-background/80 max-w-2xl mx-auto text-lg mt-4">
            At MeriGarageReviews, we're committed to creating a trustworthy platform where customers and garages can connect with confidence.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 bg-background flex-grow">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            
            {/* Trust Pillars */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-card rounded-2xl p-6 border border-border text-center">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Verified Reviews</h3>
                <p className="text-muted-foreground text-sm">
                  We verify reviews with receipt uploads to ensure authentic feedback from real customers.
                </p>
              </div>
              <div className="bg-card rounded-2xl p-6 border border-border text-center">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Moderated Content</h3>
                <p className="text-muted-foreground text-sm">
                  Every review is moderated by our team before publication to maintain quality standards.
                </p>
              </div>
              <div className="bg-card rounded-2xl p-6 border border-border text-center">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Data Protection</h3>
                <p className="text-muted-foreground text-sm">
                  Your personal information is encrypted and never sold to third parties.
                </p>
              </div>
            </div>

            <div className="bg-card rounded-2xl p-8 md:p-12 shadow-lg border border-border">
              <div className="prose prose-lg max-w-none">
                
                <h2 className="text-2xl font-bold text-foreground mb-4">Our Commitment to Trust</h2>
                <p className="text-muted-foreground mb-6">
                  MeriGarageReviews is built on the foundation of trust. We understand that choosing the right garage for your vehicle is an important decision, and we're here to help you make informed choices based on genuine customer experiences.
                </p>

                <h2 className="text-2xl font-bold text-foreground mb-4">How We Ensure Authenticity</h2>
                <ul className="text-muted-foreground mb-6 space-y-3">
                  <li><strong>Receipt Verification:</strong> Customers can upload service receipts to verify their garage visits. Verified reviews earn bonus points and are highlighted on the platform.</li>
                  <li><strong>Review Moderation:</strong> Our team reviews every submission before it goes live. We check for inappropriate content, spam, and fake reviews.</li>
                  <li><strong>User Authentication:</strong> All reviewers must create an account with a verified email address to submit reviews.</li>
                  <li><strong>No Paid Reviews:</strong> Garages cannot pay to have positive reviews posted or negative reviews removed.</li>
                </ul>

                <h2 className="text-2xl font-bold text-foreground mb-4">Protecting Garages</h2>
                <p className="text-muted-foreground mb-6">
                  We understand that unfair reviews can harm a garage's reputation. That's why we:
                </p>
                <ul className="text-muted-foreground mb-6 space-y-2">
                  <li>Review all submissions for accuracy and fairness</li>
                  <li>Remove reviews that contain false information or personal attacks</li>
                  <li>Allow garages to respond to reviews publicly</li>
                  <li>Investigate reports of fraudulent reviews</li>
                </ul>

                <h2 className="text-2xl font-bold text-foreground mb-4">Reporting Concerns</h2>
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl p-6 mb-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-amber-800 dark:text-amber-400 mb-2">See something suspicious?</h4>
                      <p className="text-amber-700 dark:text-amber-300 text-sm">
                        If you encounter a review that seems fake, inappropriate, or violates our guidelines, please report it to us at{" "}
                        <a href="mailto:info@merigarage.com" className="underline">info@merigarage.com</a>. We take all reports seriously and investigate promptly.
                      </p>
                    </div>
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-foreground mb-4">Your Privacy & Security</h2>
                <ul className="text-muted-foreground mb-6 space-y-2">
                  <li><strong>Encrypted Data:</strong> All personal information is encrypted using industry-standard protocols</li>
                  <li><strong>No Data Selling:</strong> We never sell your personal information to third parties</li>
                  <li><strong>Anonymous Reviews:</strong> Your contact details are never shown publicly on reviews</li>
                  <li><strong>Secure Payments:</strong> All reward redemptions are processed through secure channels</li>
                </ul>

                <h2 className="text-2xl font-bold text-foreground mb-4">Contact Our Trust & Safety Team</h2>
                <p className="text-muted-foreground">
                  For any trust and safety concerns, please reach out to us at{" "}
                  <a href="mailto:info@merigarage.com" className="text-primary hover:underline">
                    info@merigarage.com
                  </a>{" "}
                  or call us at +91 9582051155.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default TrustSafety;
