import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Target, Eye, Wrench, Users, BarChart3 } from "lucide-react";

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 bg-foreground">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-background mb-6">
            About Us
          </h1>
          <p className="text-xl text-background/80 max-w-3xl mx-auto">
            Transforming traditional garages into fully digital, future-ready businesses
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 bg-background flex-grow">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-card rounded-2xl p-8 md:p-12 shadow-lg border border-border mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
                Who We Are
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                At <span className="text-primary font-semibold">MERI GARAGE</span>, we believe managing a garage should be simple, efficient, and stress-free. We are a next-generation Garage Management Software designed to empower workshops, auto-repair centers, and service stations with smart digital solutions.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                From job card creation to customer approvals, invoicing, inventory, service reminders, expense management, and detailed analytics – MERI GARAGE offers an all-in-one platform that transforms traditional garages into fully digital, future-ready businesses.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="bg-card rounded-xl p-6 border border-border text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wrench className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Job Card Creation</h3>
                <p className="text-sm text-muted-foreground">Streamlined workflow management</p>
              </div>
              <div className="bg-card rounded-xl p-6 border border-border text-center">
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Customer Approvals</h3>
                <p className="text-sm text-muted-foreground">Digital consent & communication</p>
              </div>
              <div className="bg-card rounded-xl p-6 border border-border text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Analytics</h3>
                <p className="text-sm text-muted-foreground">Detailed business insights</p>
              </div>
            </div>

            <p className="text-lg text-muted-foreground leading-relaxed text-center mb-12">
              With a commitment to innovation and customer satisfaction, we are redefining the way garages operate, helping owners save time, increase productivity, and deliver exceptional service to their customers.
            </p>

            {/* Mission & Vision */}
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-primary/5 rounded-2xl p-8 border border-primary/20">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                  <Target className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-4">Our Mission</h3>
                <p className="text-muted-foreground leading-relaxed">
                  To digitally empower every garage and workshop with simple, powerful, and affordable solutions that streamline operations, improve customer satisfaction, and drive sustainable business growth.
                </p>
              </div>
              <div className="bg-accent/5 rounded-2xl p-8 border border-accent/20">
                <div className="w-14 h-14 bg-accent/10 rounded-full flex items-center justify-center mb-6">
                  <Eye className="w-7 h-7 text-accent" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-4">Our Vision</h3>
                <p className="text-muted-foreground leading-relaxed">
                  To become the most trusted Garage Management Platform worldwide, enabling workshops of all sizes to embrace technology, achieve operational excellence, and create a seamless experience for every vehicle owner.
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

export default AboutUs;
