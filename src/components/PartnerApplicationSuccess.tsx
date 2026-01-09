import { CheckCircle2, Mail, Calendar, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface PartnerApplicationSuccessProps {
  applicantName: string;
  email: string;
}

export const PartnerApplicationSuccess = ({ applicantName, email }: PartnerApplicationSuccessProps) => {
  const navigate = useNavigate();
  const firstName = applicantName.split(" ")[0];

  return (
    <div className="min-h-[60vh] flex items-center justify-center py-12 px-4">
      <Card className="max-w-lg w-full text-center border-success/30 shadow-lg">
        <CardContent className="pt-8 pb-8 px-6">
          {/* Success Icon */}
          <div className="w-20 h-20 mx-auto mb-6 bg-success/10 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-success" />
          </div>

          {/* Congratulations Message */}
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            Congratulations, {firstName}! 🎉
          </h1>
          
          <p className="text-lg text-muted-foreground mb-6">
            Your application to become a <span className="font-semibold text-primary">MeriGarage Partner</span> has been submitted successfully!
          </p>

          {/* Email Notification Box */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Mail className="w-5 h-5 text-primary" />
              <span className="font-semibold text-foreground">Check Your Email</span>
            </div>
            <p className="text-sm text-muted-foreground">
              We've sent a confirmation email to <span className="font-medium text-foreground">{email}</span>
            </p>
          </div>

          {/* Next Steps */}
          <div className="bg-accent/30 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-accent" />
              What's Next?
            </h3>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</span>
                <span>Our team will review your application</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</span>
                <span>You'll receive an invite to our <strong>Partner Webinar</strong> in the coming weeks</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0">3</span>
                <span>Complete onboarding and start earning!</span>
              </li>
            </ol>
          </div>

          {/* Thank You Note */}
          <p className="text-sm text-muted-foreground mb-6">
            Thank you for your interest in joining the MeriGarage Partner network. 
            We're excited to have you on board!
          </p>

          {/* Action Button */}
          <Button 
            onClick={() => navigate("/partners")}
            className="w-full sm:w-auto"
          >
            Back to Partners Page
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
