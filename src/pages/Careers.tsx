import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Users, Heart, Rocket, Coffee, Globe, Award, Briefcase, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

const cultureValues = [
  {
    icon: Heart,
    title: "People First",
    description: "We believe our team is our greatest asset. Your well-being, growth, and happiness matter to us."
  },
  {
    icon: Rocket,
    title: "Innovation Driven",
    description: "We encourage creative thinking and embrace new ideas. Every voice matters in shaping our products."
  },
  {
    icon: Users,
    title: "Collaborative Spirit",
    description: "We work together as one team, supporting each other to achieve common goals and celebrate wins together."
  },
  {
    icon: Coffee,
    title: "Work-Life Balance",
    description: "We respect your personal time. Flexible hours and remote work options help you stay productive and happy."
  },
  {
    icon: Globe,
    title: "Global Impact",
    description: "Be part of a mission to transform garages worldwide, starting from India to the global market."
  },
  {
    icon: Award,
    title: "Growth Opportunities",
    description: "Continuous learning, mentorship programs, and clear career paths to help you reach your full potential."
  }
];

const openPositions = [
  {
    title: "Full Stack Developer",
    department: "Engineering",
    location: "Delhi, India (Hybrid)",
    type: "Full-time"
  },
  {
    title: "Product Manager",
    department: "Product",
    location: "Delhi, India / Remote",
    type: "Full-time"
  },
  {
    title: "UI/UX Designer",
    department: "Design",
    location: "Remote",
    type: "Full-time"
  },
  {
    title: "Business Development Executive",
    department: "Sales",
    location: "Mumbai / Delhi, India",
    type: "Full-time"
  },
  {
    title: "Customer Success Manager",
    department: "Operations",
    location: "Dubai, UAE",
    type: "Full-time"
  }
];

const Careers = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 bg-foreground">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-background mb-6">
            Join Our Team
          </h1>
          <p className="text-xl text-background/80 max-w-3xl mx-auto">
            Be part of a passionate team that's revolutionizing the garage industry. 
            Build your career while making a real impact.
          </p>
        </div>
      </section>

      {/* Culture Section */}
      <section className="py-16 bg-background flex-grow">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Our Culture
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              At MERI GARAGE, we've built a culture that values innovation, collaboration, and personal growth. 
              Here's what makes us special:
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {cultureValues.map((value, index) => (
              <div 
                key={index}
                className="bg-card rounded-2xl p-6 border border-border hover:border-primary/30 transition-all hover:shadow-lg"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <value.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{value.title}</h3>
                <p className="text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>

          {/* Why Join Us */}
          <div className="bg-primary/5 rounded-2xl p-8 md:p-12 border border-primary/20 mb-16">
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-6 text-center">
              Why Join MERI GARAGE?
            </h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold text-foreground mb-3">Competitive Benefits</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Competitive salary packages</li>
                  <li>• Health insurance for you and family</li>
                  <li>• Performance bonuses</li>
                  <li>• Paid time off and holidays</li>
                  <li>• Professional development budget</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-3">Perks & Extras</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Flexible working hours</li>
                  <li>• Remote work options</li>
                  <li>• Team outings and events</li>
                  <li>• Learning & certification support</li>
                  <li>• Modern office in prime location</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Open Positions */}
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
              Open Positions
            </h3>
            <div className="space-y-4">
              {openPositions.map((position, index) => (
                <div 
                  key={index}
                  className="bg-card rounded-xl p-6 border border-border hover:border-primary/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div>
                    <h4 className="text-lg font-semibold text-foreground">{position.title}</h4>
                    <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        {position.department}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {position.location}
                      </span>
                      <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
                        {position.type}
                      </span>
                    </div>
                  </div>
                  <Button>Apply Now</Button>
                </div>
              ))}
            </div>

            {/* No suitable position CTA */}
            <div className="mt-12 text-center bg-secondary/50 rounded-2xl p-8">
              <h4 className="text-xl font-semibold text-foreground mb-2">
                Don't see a suitable position?
              </h4>
              <p className="text-muted-foreground mb-4">
                We're always looking for talented individuals. Send us your resume and we'll keep you in mind for future opportunities.
              </p>
              <Button variant="outline" asChild>
                <a href="mailto:careers@merigarage.com">Send Your Resume</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Careers;
