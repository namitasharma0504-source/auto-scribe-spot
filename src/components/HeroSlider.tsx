import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const heroSlides = [
  {
    image: "https://images.unsplash.com/photo-1625047509248-ec889cbff17f?w=1200&h=800&fit=crop&q=80",
    alt: "Professional automobile garage",
    headline: "Find Trusted Mechanics",
    subline: "Near You"
  },
  {
    image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1200&h=800&fit=crop&q=80",
    alt: "Mechanic working on car engine",
    headline: "Read Verified Reviews",
    subline: "Before You Visit"
  },
  {
    image: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=1200&h=800&fit=crop&q=80",
    alt: "Modern car service center",
    headline: "Compare & Choose",
    subline: "The Best Garage"
  },
  {
    image: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=1200&h=800&fit=crop&q=80",
    alt: "Car repair workshop",
    headline: "Get Instant Quotes",
    subline: "Save Time & Money"
  }
];

interface HeroSliderProps {
  onSlideChange?: (index: number) => void;
}

export const HeroSlider = ({ onSlideChange }: HeroSliderProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    onSlideChange?.(currentSlide);
  }, [currentSlide, onSlideChange]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const goToPrev = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  return (
    <div className="absolute inset-0">
      {heroSlides.map((slide, index) => (
        <img
          key={index}
          src={slide.image}
          alt={slide.alt}
          loading={index === 0 ? "eager" : "lazy"}
          fetchPriority={index === 0 ? "high" : "auto"}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            index === currentSlide ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-foreground/50 via-foreground/40 to-foreground/60" />
      
      {/* Navigation Arrows */}
      <button
        onClick={goToPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-background/20 hover:bg-background/40 flex items-center justify-center transition-colors"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6 text-primary-foreground" />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-background/20 hover:bg-background/40 flex items-center justify-center transition-colors"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6 text-primary-foreground" />
      </button>
      
      {/* Dots */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {heroSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentSlide 
                ? "bg-primary w-6" 
                : "bg-primary-foreground/50 hover:bg-primary-foreground/70"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
