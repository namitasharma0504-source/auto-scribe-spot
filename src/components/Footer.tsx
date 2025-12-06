import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, ExternalLink, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export const Footer = () => {
  const { user } = useAuth();

  return (
    <footer className="bg-card border-t border-border py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <span className="font-bold text-foreground text-lg">MeriGarage</span>
            </Link>
            <ul className="space-y-3 text-muted-foreground text-sm">
              <li className="flex items-start gap-2">
                <Phone className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                <a href="tel:+919582051155" className="hover:text-primary transition-colors">+91 9582051155</a>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                <a href="mailto:info@merigarage.com" className="hover:text-primary transition-colors">info@merigarage.com</a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                <span>Delhi, India | Dubai, UAE</span>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-foreground mb-4">Discover</h4>
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li><Link to="/search" className="hover:text-primary transition-colors">Browse Garages</Link></li>
              <li><Link to="/search?sort=rating" className="hover:text-primary transition-colors">Top Rated</Link></li>
              <li><Link to="/search" className="hover:text-primary transition-colors">Near Me</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-foreground mb-4">For Garages</h4>
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li>
                <a 
                  href="https://merigarage.com/GarageAdmin/login.php" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors flex items-center gap-1"
                >
                  Buy MeriGarage Software
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li><Link to="/list-garage" className="hover:text-primary transition-colors">List Your Garage</Link></li>
              <li><Link to="/advertise" className="hover:text-primary transition-colors">Advertise With Us</Link></li>
              <li><Link to="/garage-auth" className="hover:text-primary transition-colors">Garage Login</Link></li>
              {user && (
                <li><Link to="/garage-dashboard" className="hover:text-primary transition-colors">Garage Dashboard</Link></li>
              )}
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-foreground mb-4">Company</h4>
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li><Link to="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
              <li><Link to="/careers" className="hover:text-primary transition-colors">Careers</Link></li>
              <li><Link to="/trust-safety" className="hover:text-primary transition-colors">Trust & Safety</Link></li>
              <li><Link to="/content-guidelines" className="hover:text-primary transition-colors">Content Guidelines</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-foreground mb-4">Legal</h4>
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li><Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-foreground mb-4">Customer</h4>
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li><Link to="/rewards" className="hover:text-primary transition-colors">Rewards Program</Link></li>
              <li><Link to="/submit-review" className="hover:text-primary transition-colors">Write a Review</Link></li>
              <li>
                <Link to="/admin" className="hover:text-primary transition-colors flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Admin Login
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-border text-center text-muted-foreground">
          <p>© 2024 MeriGarageReviews. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
