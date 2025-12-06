import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Shield, Lock, Eye, UserCheck, AlertTriangle, Mail } from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      {/* Hero Section */}
      <section className="py-16 bg-foreground">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="w-10 h-10 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold text-background">
              Privacy Policy
            </h1>
          </div>
          <p className="text-background/80">Last updated: December 2024</p>
          <p className="text-background/90 mt-4 max-w-2xl mx-auto text-lg">
            Your privacy matters to us. We are committed to protecting your personal information and being transparent about how we use it.
          </p>
        </div>
      </section>

      {/* Trust Banner */}
      <section className="py-6 bg-primary/10 border-b border-primary/20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-center">
            <div className="flex items-center gap-2 text-primary font-semibold">
              <Lock className="w-5 h-5" />
              <span>Your Data is Secure</span>
            </div>
            <div className="flex items-center gap-2 text-primary font-semibold">
              <Eye className="w-5 h-5" />
              <span>We Do NOT Sell Your Personal Information</span>
            </div>
            <div className="flex items-center gap-2 text-primary font-semibold">
              <UserCheck className="w-5 h-5" />
              <span>You Control Your Data</span>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 bg-background flex-grow">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-card rounded-2xl p-8 md:p-12 shadow-lg border border-border">
            <div className="prose prose-lg max-w-none">
              
              {/* Our Commitment */}
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-xl p-6 mb-8">
                <h2 className="text-xl font-bold text-green-800 dark:text-green-400 mb-3 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Our Privacy Commitment
                </h2>
                <ul className="text-green-700 dark:text-green-300 space-y-2 text-sm">
                  <li>✓ We will <strong>NEVER</strong> sell your personal information to third parties</li>
                  <li>✓ We only collect information necessary to provide our services</li>
                  <li>✓ You can request deletion of your data at any time</li>
                  <li>✓ We use industry-standard encryption to protect your data</li>
                  <li>✓ We are transparent about how we use your information</li>
                </ul>
              </div>

              <h2 className="text-2xl font-bold text-foreground mb-4">1. Information We Collect</h2>
              <p className="text-muted-foreground mb-4">
                We collect only the information necessary to provide you with our services:
              </p>
              <ul className="text-muted-foreground mb-6 space-y-2">
                <li><strong>Account Information:</strong> Name, email address, and phone number when you create an account</li>
                <li><strong>Review Content:</strong> The reviews, ratings, and feedback you submit about garages</li>
                <li><strong>Verification Data:</strong> Receipt uploads for verified reviews (optional)</li>
                <li><strong>Usage Data:</strong> How you interact with our platform to improve your experience</li>
              </ul>

              <h2 className="text-2xl font-bold text-foreground mb-4">2. How We Use Your Information</h2>
              <p className="text-muted-foreground mb-4">
                We use your information solely to:
              </p>
              <ul className="text-muted-foreground mb-6 space-y-2">
                <li>Provide, maintain, and improve our review platform</li>
                <li>Process your reviews and display them to help other customers</li>
                <li>Award points for verified reviews and manage your rewards</li>
                <li>Send you important updates about your account and our services</li>
                <li>Respond to your questions and provide customer support</li>
                <li>Prevent fraud and ensure platform security</li>
              </ul>

              <h2 className="text-2xl font-bold text-foreground mb-4">3. We Do NOT Sell Your Data</h2>
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-xl p-6 mb-6">
                <p className="text-blue-800 dark:text-blue-300 font-medium">
                  <strong>Clear and Simple:</strong> MeriGarageReviews does NOT sell, rent, or trade your personal information to third parties for their marketing purposes. Your data belongs to you.
                </p>
              </div>

              <h2 className="text-2xl font-bold text-foreground mb-4">4. Information Sharing</h2>
              <p className="text-muted-foreground mb-4">
                We only share your information in these limited circumstances:
              </p>
              <ul className="text-muted-foreground mb-6 space-y-2">
                <li><strong>Your Reviews:</strong> Reviews you submit are publicly visible to help other customers (your email and phone are never shown)</li>
                <li><strong>Service Providers:</strong> Trusted partners who help us operate our platform (bound by strict confidentiality agreements)</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and users' safety</li>
              </ul>

              <h2 className="text-2xl font-bold text-foreground mb-4">5. Data Security</h2>
              <p className="text-muted-foreground mb-6">
                We take the security of your data seriously. We use industry-standard encryption (SSL/TLS) to protect data in transit, secure servers with regular security audits, access controls that limit who can view your information, and regular backups to prevent data loss. While no system is 100% secure, we continuously work to protect your information.
              </p>

              <h2 className="text-2xl font-bold text-foreground mb-4">6. Your Rights & Control</h2>
              <p className="text-muted-foreground mb-4">
                You have full control over your data:
              </p>
              <ul className="text-muted-foreground mb-6 space-y-2">
                <li><strong>Access:</strong> Request a copy of all data we have about you</li>
                <li><strong>Correction:</strong> Update or correct your personal information anytime</li>
                <li><strong>Deletion:</strong> Request complete deletion of your account and data</li>
                <li><strong>Portability:</strong> Export your reviews and account data</li>
                <li><strong>Opt-out:</strong> Unsubscribe from marketing communications at any time</li>
              </ul>

              <h2 className="text-2xl font-bold text-foreground mb-4">7. Cookies & Tracking</h2>
              <p className="text-muted-foreground mb-6">
                We use essential cookies to keep you logged in and remember your preferences. We use analytics to understand how users interact with our platform and improve it. We do NOT use tracking for advertising purposes or sell cookie data.
              </p>

              <h2 className="text-2xl font-bold text-foreground mb-4">8. Children's Privacy</h2>
              <p className="text-muted-foreground mb-6">
                Our services are not directed to children under 18. We do not knowingly collect personal information from children. If you believe a child has provided us with their data, please contact us immediately.
              </p>

              <h2 className="text-2xl font-bold text-foreground mb-4">9. Changes to This Policy</h2>
              <p className="text-muted-foreground mb-6">
                We may update this Privacy Policy from time to time. When we make significant changes, we will notify you via email or a prominent notice on our platform. We encourage you to review this policy periodically.
              </p>

              <h2 className="text-2xl font-bold text-foreground mb-4">10. Contact Us</h2>
              <div className="bg-muted/50 rounded-xl p-6">
                <p className="text-muted-foreground mb-4">
                  If you have any questions about this Privacy Policy or how we handle your data, we're here to help:
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <a 
                    href="mailto:info@merigarage.com" 
                    className="flex items-center gap-2 text-primary hover:underline font-medium"
                  >
                    <Mail className="w-5 h-5" />
                    info@merigarage.com
                  </a>
                  <span className="text-muted-foreground">or call +91 9582051155</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
