import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FileText, CheckCircle, XCircle, AlertTriangle, Star, MessageSquare } from "lucide-react";

const ContentGuidelines = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      {/* Hero Section */}
      <section className="py-16 bg-foreground">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <FileText className="w-10 h-10 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold text-background">
              Content Guidelines
            </h1>
          </div>
          <p className="text-background/80 max-w-2xl mx-auto text-lg mt-4">
            Help us maintain a helpful and trustworthy review platform by following these guidelines when writing your reviews.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 bg-background flex-grow">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            
            {/* Quick Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              <div className="bg-green-50 dark:bg-green-950/20 rounded-2xl p-6 border border-green-200 dark:border-green-900">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <h3 className="font-semibold text-green-800 dark:text-green-400">What We Encourage</h3>
                </div>
                <ul className="text-green-700 dark:text-green-300 text-sm space-y-2">
                  <li>✓ Honest, detailed experiences</li>
                  <li>✓ Specific service descriptions</li>
                  <li>✓ Constructive feedback</li>
                  <li>✓ Fair and balanced reviews</li>
                  <li>✓ Verified reviews with receipts</li>
                </ul>
              </div>
              <div className="bg-red-50 dark:bg-red-950/20 rounded-2xl p-6 border border-red-200 dark:border-red-900">
                <div className="flex items-center gap-2 mb-4">
                  <XCircle className="w-6 h-6 text-red-600" />
                  <h3 className="font-semibold text-red-800 dark:text-red-400">What's Not Allowed</h3>
                </div>
                <ul className="text-red-700 dark:text-red-300 text-sm space-y-2">
                  <li>✗ Fake or paid reviews</li>
                  <li>✗ Personal attacks or threats</li>
                  <li>✗ Inappropriate language</li>
                  <li>✗ Spam or promotional content</li>
                  <li>✗ False or misleading claims</li>
                </ul>
              </div>
            </div>

            <div className="bg-card rounded-2xl p-8 md:p-12 shadow-lg border border-border">
              <div className="prose prose-lg max-w-none">
                
                <h2 className="text-2xl font-bold text-foreground mb-4">Writing Helpful Reviews</h2>
                <p className="text-muted-foreground mb-6">
                  Your reviews help other car owners make informed decisions. Here's how to write reviews that truly help:
                </p>

                <div className="bg-muted/30 rounded-xl p-6 mb-6">
                  <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Star className="w-5 h-5 text-primary" />
                    Tips for Great Reviews
                  </h3>
                  <ul className="text-muted-foreground space-y-2 text-sm">
                    <li><strong>Be specific:</strong> Mention the service you received (oil change, brake repair, AC service, etc.)</li>
                    <li><strong>Include details:</strong> How long did the service take? Were prices fair? How was the staff?</li>
                    <li><strong>Be fair:</strong> Consider the full experience, not just one aspect</li>
                    <li><strong>Stay recent:</strong> Review based on your most recent visit</li>
                    <li><strong>Upload receipts:</strong> Verify your visit for bonus points and credibility</li>
                  </ul>
                </div>

                <h2 className="text-2xl font-bold text-foreground mb-4">Review Standards</h2>
                
                <h3 className="text-lg font-semibold text-foreground mb-3">Authenticity</h3>
                <p className="text-muted-foreground mb-4">
                  Reviews must be based on real experiences at the garage. You should only review garages you have actually visited. Creating fake positive or negative reviews is strictly prohibited and may result in account suspension.
                </p>

                <h3 className="text-lg font-semibold text-foreground mb-3">Respectful Language</h3>
                <p className="text-muted-foreground mb-4">
                  While we understand frustrating experiences happen, please express your feedback professionally. Reviews containing profanity, personal attacks, discriminatory language, or threats will be removed.
                </p>

                <h3 className="text-lg font-semibold text-foreground mb-3">Relevance</h3>
                <p className="text-muted-foreground mb-4">
                  Focus on the garage's services, quality, pricing, and customer service. Personal disputes unrelated to the service, political or religious commentary, and promotional content are not appropriate for reviews.
                </p>

                <h3 className="text-lg font-semibold text-foreground mb-3">Accuracy</h3>
                <p className="text-muted-foreground mb-6">
                  Please ensure your review is accurate. Making false claims about a garage can harm their business and mislead other customers. If you're unsure about something, focus on what you can verify.
                </p>

                <h2 className="text-2xl font-bold text-foreground mb-4">What Happens to Your Review</h2>
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-xl p-6 mb-6">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-800 dark:text-blue-400 mb-2">Our Moderation Process</h4>
                      <ol className="text-blue-700 dark:text-blue-300 text-sm space-y-1 list-decimal list-inside">
                        <li>You submit your review</li>
                        <li>Our team reviews it for guideline compliance</li>
                        <li>If approved, your review goes live and you earn points</li>
                        <li>If rejected, you'll receive an explanation</li>
                        <li>Verified reviews (with receipts) are highlighted</li>
                      </ol>
                    </div>
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-foreground mb-4">Consequences of Violations</h2>
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl p-6 mb-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-amber-700 dark:text-amber-300 text-sm">
                        Reviews that violate our guidelines will be removed. Repeated violations may result in:
                      </p>
                      <ul className="text-amber-700 dark:text-amber-300 text-sm mt-2 space-y-1">
                        <li>• Warning notification</li>
                        <li>• Points deduction</li>
                        <li>• Temporary suspension</li>
                        <li>• Permanent account ban for severe violations</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-foreground mb-4">For Garage Owners</h2>
                <p className="text-muted-foreground mb-4">
                  Garage owners can respond to reviews through their dashboard. When responding:
                </p>
                <ul className="text-muted-foreground mb-6 space-y-2">
                  <li>• Thank customers for positive feedback</li>
                  <li>• Address concerns professionally and offer solutions</li>
                  <li>• Never retaliate against negative reviews</li>
                  <li>• Take discussions offline when needed</li>
                </ul>

                <h2 className="text-2xl font-bold text-foreground mb-4">Questions?</h2>
                <p className="text-muted-foreground">
                  If you have questions about our content guidelines or need to report a review, contact us at{" "}
                  <a href="mailto:info@merigarage.com" className="text-primary hover:underline">
                    info@merigarage.com
                  </a>
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

export default ContentGuidelines;
