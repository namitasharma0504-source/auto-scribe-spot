import { useEffect } from "react";

interface SEOHeadProps {
  title: string;
  description: string;
  canonicalUrl: string;
  ogImage?: string;
  ogType?: "website" | "article" | "profile";
  siteName?: string;
  twitterCard?: "summary" | "summary_large_image";
  keywords?: string;
  author?: string;
}

export function SEOHead({
  title,
  description,
  canonicalUrl,
  ogImage,
  ogType = "website",
  siteName = "MeriGarage",
  twitterCard = "summary_large_image",
  keywords,
  author,
}: SEOHeadProps) {
  useEffect(() => {
    // Update document title
    document.title = title;

    // Helper to update or create a meta tag
    const updateMetaTag = (selector: string, attribute: string, content: string) => {
      let element = document.querySelector(selector) as HTMLMetaElement | null;
      if (!element) {
        element = document.createElement("meta");
        if (selector.includes("property=")) {
          element.setAttribute("property", selector.match(/property="([^"]+)"/)?.[1] || "");
        } else if (selector.includes("name=")) {
          element.setAttribute("name", selector.match(/name="([^"]+)"/)?.[1] || "");
        }
        document.head.appendChild(element);
      }
      element.setAttribute(attribute, content);
    };

    // Helper to update or create a link tag
    const updateLinkTag = (rel: string, href: string) => {
      let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (!element) {
        element = document.createElement("link");
        element.setAttribute("rel", rel);
        document.head.appendChild(element);
      }
      element.setAttribute("href", href);
    };

    // Update meta description
    updateMetaTag('meta[name="description"]', "content", description);

    // Update canonical URL
    updateLinkTag("canonical", canonicalUrl);

    // Open Graph tags
    updateMetaTag('meta[property="og:title"]', "content", title);
    updateMetaTag('meta[property="og:description"]', "content", description);
    updateMetaTag('meta[property="og:url"]', "content", canonicalUrl);
    updateMetaTag('meta[property="og:type"]', "content", ogType);
    updateMetaTag('meta[property="og:site_name"]', "content", siteName);

    if (ogImage) {
      updateMetaTag('meta[property="og:image"]', "content", ogImage);
      updateMetaTag('meta[property="og:image:width"]', "content", "1200");
      updateMetaTag('meta[property="og:image:height"]', "content", "630");
    }

    // Twitter Card tags
    updateMetaTag('meta[name="twitter:card"]', "content", twitterCard);
    updateMetaTag('meta[name="twitter:title"]', "content", title);
    updateMetaTag('meta[name="twitter:description"]', "content", description);
    if (ogImage) {
      updateMetaTag('meta[name="twitter:image"]', "content", ogImage);
    }

    // Optional tags
    if (keywords) {
      updateMetaTag('meta[name="keywords"]', "content", keywords);
    }
    if (author) {
      updateMetaTag('meta[name="author"]', "content", author);
    }

    // Cleanup function to reset to defaults when component unmounts
    return () => {
      document.title = "MeriGarage - Find & Review Auto Garages in India";
      const descMeta = document.querySelector('meta[name="description"]') as HTMLMetaElement;
      if (descMeta) {
        descMeta.content = "Find trusted auto garages near you. Read verified reviews, compare ratings, and get quotes from the best mechanics in India.";
      }
    };
  }, [title, description, canonicalUrl, ogImage, ogType, siteName, twitterCard, keywords, author]);

  return null;
}
