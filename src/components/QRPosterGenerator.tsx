import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import meriGarageLogo from "@/assets/merigarage-logo-main.png";

interface QRPosterGeneratorProps {
  garageName: string;
  url: string;
}

export function QRPosterGenerator({ garageName, url }: QRPosterGeneratorProps) {
  const posterRef = useRef<HTMLDivElement>(null);
  const fullUrl = url.startsWith("http") ? url : `https://merigaragereviews.com${url}`;

  const downloadPoster = async () => {
    if (!posterRef.current) return;

    // Create a canvas with higher resolution for print quality
    const canvas = document.createElement("canvas");
    const scale = 3; // 3x resolution for print quality
    const posterWidth = 600;
    const posterHeight = 800;
    
    canvas.width = posterWidth * scale;
    canvas.height = posterHeight * scale;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.scale(scale, scale);

    // Background - white
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, posterWidth, posterHeight);

    // Header background - brand blue
    ctx.fillStyle = "#1E3A8A";
    ctx.fillRect(0, 0, posterWidth, 100);

    // Load and draw logo
    const logo = new Image();
    logo.crossOrigin = "anonymous";
    
    await new Promise<void>((resolve) => {
      logo.onload = () => {
        // Draw logo centered in header
        const logoHeight = 50;
        const logoWidth = (logo.width / logo.height) * logoHeight;
        ctx.drawImage(logo, (posterWidth - logoWidth) / 2, 25, logoWidth, logoHeight);
        resolve();
      };
      logo.onerror = () => {
        // Fallback: draw text if logo fails
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 28px Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("MeriGarage Reviews", posterWidth / 2, 60);
        resolve();
      };
      logo.src = meriGarageLogo;
    });

    // Garage name
    ctx.fillStyle = "#1E3A8A";
    ctx.font = "bold 28px Arial, sans-serif";
    ctx.textAlign = "center";
    
    // Handle long garage names with word wrap
    const maxWidth = posterWidth - 60;
    const words = garageName.split(" ");
    let line = "";
    let y = 150;
    
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && i > 0) {
        ctx.fillText(line.trim(), posterWidth / 2, y);
        line = words[i] + " ";
        y += 35;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), posterWidth / 2, y);

    // Stars decoration
    const starsY = y + 30;
    ctx.fillStyle = "#F59E0B"; // Amber for stars
    const starSize = 20;
    const starSpacing = 30;
    const totalStarsWidth = 5 * starSpacing;
    const startX = (posterWidth - totalStarsWidth) / 2 + 15;
    
    for (let i = 0; i < 5; i++) {
      drawStar(ctx, startX + i * starSpacing, starsY, starSize / 2, 5, 0.5);
    }

    // Get QR code SVG and draw it
    const qrSvg = document.getElementById("poster-qr-code");
    if (qrSvg) {
      const svgData = new XMLSerializer().serializeToString(qrSvg);
      const qrImg = new Image();
      
      await new Promise<void>((resolve) => {
        qrImg.onload = () => {
          const qrSize = 250;
          const qrX = (posterWidth - qrSize) / 2;
          const qrY = starsY + 40;
          
          // QR code background with shadow effect
          ctx.fillStyle = "#F8FAFC";
          ctx.shadowColor = "rgba(0, 0, 0, 0.1)";
          ctx.shadowBlur = 20;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 4;
          roundRect(ctx, qrX - 20, qrY - 20, qrSize + 40, qrSize + 40, 16);
          ctx.fill();
          ctx.shadowColor = "transparent";
          
          // Draw QR code
          ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
          resolve();
        };
        qrImg.onerror = () => resolve();
        qrImg.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
      });
    }

    // Call to action text
    const ctaY = 580;
    ctx.fillStyle = "#1E3A8A";
    ctx.font = "bold 24px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Scan to Review Us!", ctaY > 500 ? ctaY : 580, 600);

    // Subtitle
    ctx.fillStyle = "#64748B";
    ctx.font = "16px Arial, sans-serif";
    ctx.fillText("Your feedback helps us serve you better", posterWidth / 2, 635);

    // Footer
    ctx.fillStyle = "#F1F5F9";
    ctx.fillRect(0, posterHeight - 80, posterWidth, 80);
    
    // Footer text
    ctx.fillStyle = "#64748B";
    ctx.font = "14px Arial, sans-serif";
    ctx.fillText("www.merigaragereviews.com", posterWidth / 2, posterHeight - 45);
    
    ctx.fillStyle = "#94A3B8";
    ctx.font = "12px Arial, sans-serif";
    ctx.fillText("India's Trusted Garage Review Platform", posterWidth / 2, posterHeight - 25);

    // Download the canvas as PNG
    const dataUrl = canvas.toDataURL("image/png", 1.0);
    const link = document.createElement("a");
    link.download = `${garageName.replace(/\s+/g, "-").toLowerCase()}-review-poster.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Hidden QR for poster generation */}
      <div className="hidden">
        <QRCodeSVG
          id="poster-qr-code"
          value={fullUrl}
          size={250}
          level="H"
          includeMargin={false}
          imageSettings={{
            src: "/favicon.png",
            x: undefined,
            y: undefined,
            height: 35,
            width: 35,
            excavate: true,
          }}
        />
      </div>

      {/* Poster Preview */}
      <div 
        ref={posterRef}
        className="w-[300px] bg-white rounded-xl shadow-lg overflow-hidden border border-border"
      >
        {/* Header */}
        <div className="bg-primary py-4 px-4 flex justify-center">
          <img src={meriGarageLogo} alt="MeriGarage Reviews" className="h-8 object-contain brightness-0 invert" />
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col items-center gap-3">
          {/* Garage Name */}
          <h3 className="text-lg font-bold text-primary text-center leading-tight">
            {garageName}
          </h3>

          {/* Stars */}
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="w-4 h-4 fill-star text-star" />
            ))}
          </div>

          {/* QR Code */}
          <div className="bg-secondary/30 p-3 rounded-xl">
            <QRCodeSVG
              value={fullUrl}
              size={120}
              level="H"
              includeMargin={false}
              imageSettings={{
                src: "/favicon.png",
                x: undefined,
                y: undefined,
                height: 20,
                width: 20,
                excavate: true,
              }}
            />
          </div>

          {/* CTA */}
          <div className="text-center">
            <p className="font-semibold text-primary text-sm">Scan to Review Us!</p>
            <p className="text-xs text-muted-foreground">Your feedback helps us serve you better</p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-secondary/50 py-2 px-4 text-center">
          <p className="text-xs text-muted-foreground">www.merigaragereviews.com</p>
        </div>
      </div>

      <Button onClick={downloadPoster} className="gap-2">
        <Download className="w-4 h-4" />
        Download Poster
      </Button>

      <p className="text-xs text-muted-foreground text-center max-w-[280px]">
        Print this poster and display it at your garage for customers to scan and leave reviews
      </p>
    </div>
  );
}

// Helper function to draw a star
function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, outerRadius: number, points: number, inset: number) {
  ctx.save();
  ctx.beginPath();
  ctx.translate(cx, cy);
  ctx.moveTo(0, -outerRadius);
  for (let i = 0; i < points; i++) {
    ctx.rotate(Math.PI / points);
    ctx.lineTo(0, -outerRadius * inset);
    ctx.rotate(Math.PI / points);
    ctx.lineTo(0, -outerRadius);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// Helper function to draw rounded rectangle
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
