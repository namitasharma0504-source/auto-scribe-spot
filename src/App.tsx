import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ScrollToTop } from "@/components/ScrollToTop";
import Index from "./pages/Index";
import SearchResults from "./pages/SearchResults";
import GarageDetails from "./pages/GarageDetails";
import WriteReview from "./pages/WriteReview";
import SubmitReview from "./pages/SubmitReview";
import Rewards from "./pages/Rewards";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import AdminAuth from "./pages/AdminAuth";
import AboutUs from "./pages/AboutUs";
import Contact from "./pages/Contact";
import Careers from "./pages/Careers";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import ListGarage from "./pages/ListGarage";
import GarageAuth from "./pages/GarageAuth";
import GarageDashboard from "./pages/GarageDashboard";
import TrustSafety from "./pages/TrustSafety";
import ContentGuidelines from "./pages/ContentGuidelines";
import Advertise from "./pages/Advertise";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <ScrollToTop />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/garage/:id" element={<GarageDetails />} />
            <Route path="/garage/:id/review" element={<WriteReview />} />
            <Route path="/submit-review" element={<SubmitReview />} />
            <Route path="/rewards" element={<Rewards />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin-login" element={<AdminAuth />} />
            <Route path="/garage-auth" element={<GarageAuth />} />
            <Route path="/garage-dashboard" element={<GarageDashboard />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/list-garage" element={<ListGarage />} />
            <Route path="/trust-safety" element={<TrustSafety />} />
            <Route path="/content-guidelines" element={<ContentGuidelines />} />
            <Route path="/advertise" element={<Advertise />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
