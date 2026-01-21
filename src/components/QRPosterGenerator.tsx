import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download, Star, Smartphone } from "lucide-react";
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

    const canvas = document.createElement("canvas");
    const scale = 3;
    const posterWidth = 600;
    const posterHeight = 900;
    
    canvas.width = posterWidth * scale;
    canvas.height = posterHeight * scale;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.scale(scale, scale);

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, posterHeight);
    gradient.addColorStop(0, "#1E3A8A");
    gradient.addColorStop(0.4, "#2563EB");
    gradient.addColorStop(1, "#1E40AF");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, posterWidth, posterHeight);

    // Decorative circles
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.beginPath();
    ctx.arc(-50, 100, 200, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(posterWidth + 50, posterHeight - 150, 250, 0, Math.PI * 2);
    ctx.fill();

    // White card container
    const cardX = 40;
    const cardY = 120;
    const cardWidth = posterWidth - 80;
    const cardHeight = 650;
    
    ctx.fillStyle = "#FFFFFF";
    ctx.shadowColor = "rgba(0, 0, 0, 0.25)";
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 10;
    roundRect(ctx, cardX, cardY, cardWidth, cardHeight, 24);
    ctx.fill();
    ctx.shadowColor = "transparent";

    // Load and draw logo at top
    const logo = new Image();
    logo.crossOrigin = "anonymous";
    
    await new Promise<void>((resolve) => {
      logo.onload = () => {
        const logoHeight = 45;
        const logoWidth = (logo.width / logo.height) * logoHeight;
        ctx.drawImage(logo, (posterWidth - logoWidth) / 2, 50, logoWidth, logoHeight);
        resolve();
      };
      logo.onerror = () => {
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 24px Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("MeriGarage Reviews", posterWidth / 2, 80);
        resolve();
      };
      logo.src = meriGarageLogo;
    });

    // Garage name with decorative line
    ctx.fillStyle = "#1E3A8A";
    ctx.font = "bold 32px Arial, sans-serif";
    ctx.textAlign = "center";
    
    const maxWidth = cardWidth - 60;
    const words = garageName.split(" ");
    let line = "";
    let y = 190;
    
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && i > 0) {
        ctx.fillText(line.trim(), posterWidth / 2, y);
        line = words[i] + " ";
        y += 40;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), posterWidth / 2, y);

    // Decorative line under garage name
    const lineY = y + 25;
    const lineGradient = ctx.createLinearGradient(posterWidth / 2 - 60, 0, posterWidth / 2 + 60, 0);
    lineGradient.addColorStop(0, "rgba(30, 58, 138, 0)");
    lineGradient.addColorStop(0.5, "#1E3A8A");
    lineGradient.addColorStop(1, "rgba(30, 58, 138, 0)");
    ctx.strokeStyle = lineGradient;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(posterWidth / 2 - 80, lineY);
    ctx.lineTo(posterWidth / 2 + 80, lineY);
    ctx.stroke();

    // Stars
    const starsY = lineY + 40;
    ctx.fillStyle = "#F59E0B";
    const starSize = 18;
    const starSpacing = 35;
    const totalStarsWidth = 5 * starSpacing;
    const startX = (posterWidth - totalStarsWidth) / 2 + 17;
    
    for (let i = 0; i < 5; i++) {
      drawStar(ctx, startX + i * starSpacing, starsY, starSize / 2, 5, 0.5);
    }

    // QR code with styled container
    const qrSvg = document.getElementById("poster-qr-code");
    if (qrSvg) {
      const svgData = new XMLSerializer().serializeToString(qrSvg);
      const qrImg = new Image();
      
      await new Promise<void>((resolve) => {
        qrImg.onload = () => {
          const qrSize = 220;
          const qrX = (posterWidth - qrSize) / 2;
          const qrY = starsY + 50;
          
          // QR container with gradient border effect
          const qrPadding = 20;
          ctx.fillStyle = "#F8FAFC";
          roundRect(ctx, qrX - qrPadding, qrY - qrPadding, qrSize + qrPadding * 2, qrSize + qrPadding * 2, 16);
          ctx.fill();
          
          // Border
          ctx.strokeStyle = "#E2E8F0";
          ctx.lineWidth = 2;
          roundRect(ctx, qrX - qrPadding, qrY - qrPadding, qrSize + qrPadding * 2, qrSize + qrPadding * 2, 16);
          ctx.stroke();
          
          ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
          resolve();
        };
        qrImg.onerror = () => resolve();
        qrImg.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
      });
    }

    // Call to action with icon styling
    const ctaY = 620;
    
    // Phone icon circle
    ctx.fillStyle = "#1E3A8A";
    ctx.beginPath();
    ctx.arc(posterWidth / 2, ctaY - 30, 25, 0, Math.PI * 2);
    ctx.fill();
    
    // Arrow pointing to QR
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "20px Arial";
    ctx.textAlign = "center";
    ctx.fillText("📱", posterWidth / 2, ctaY - 23);
    
    ctx.fillStyle = "#1E3A8A";
    ctx.font = "bold 26px Arial, sans-serif";
    ctx.fillText("Scan & Review Us!", posterWidth / 2, ctaY + 20);

    // Subtitle
    ctx.fillStyle = "#64748B";
    ctx.font = "16px Arial, sans-serif";
    ctx.fillText("Your feedback helps us serve you better", posterWidth / 2, ctaY + 50);

    // Footer section on blue background
    const footerY = posterHeight - 100;
    ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
    ctx.fillRect(0, footerY, posterWidth, 100);
    
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 16px Arial, sans-serif";
    ctx.fillText("www.merigaragereviews.com", posterWidth / 2, footerY + 35);
    
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.font = "14px Arial, sans-serif";
    ctx.fillText("India's Trusted Garage Review Platform", posterWidth / 2, footerY + 60);

    // Corner decorations
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 3;
    
    // Top left corner
    ctx.beginPath();
    ctx.moveTo(20, 40);
    ctx.lineTo(20, 20);
    ctx.lineTo(40, 20);
    ctx.stroke();
    
    // Top right corner
    ctx.beginPath();
    ctx.moveTo(posterWidth - 40, 20);
    ctx.lineTo(posterWidth - 20, 20);
    ctx.lineTo(posterWidth - 20, 40);
    ctx.stroke();

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
          size={220}
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
        className="w-[280px] bg-gradient-to-b from-primary via-blue-600 to-primary rounded-2xl shadow-2xl overflow-hidden border-2 border-primary/20 relative"
      >
        {/* Decorative circles */}
        <div className="absolute -left-10 top-10 w-32 h-32 bg-white/5 rounded-full" />
        <div className="absolute -right-10 bottom-20 w-40 h-40 bg-white/5 rounded-full" />
        
        {/* Logo */}
        <div className="pt-4 pb-2 flex justify-center relative z-10">
          <img src={meriGarageLogo} alt="MeriGarage Reviews" className="h-7 object-contain brightness-0 invert" />
        </div>

        {/* White Card */}
        <div className="mx-4 mb-4 bg-white rounded-2xl shadow-xl p-4 relative z-10">
          {/* Garage Name */}
          <h3 className="text-lg font-bold text-primary text-center leading-tight mb-2">
            {garageName}
          </h3>

          {/* Decorative line */}
          <div className="flex justify-center mb-3">
            <div className="w-20 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
          </div>

          {/* Stars */}
          <div className="flex justify-center gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="w-5 h-5 fill-star text-star" />
            ))}
          </div>

          {/* QR Code */}
          <div className="bg-secondary/30 p-3 rounded-xl border border-border mb-4">
            <QRCodeSVG
              value={fullUrl}
              size={140}
              level="H"
              includeMargin={false}
              className="mx-auto"
              imageSettings={{
                src: "/favicon.png",
                x: undefined,
                y: undefined,
                height: 22,
                width: 22,
                excavate: true,
              }}
            />
          </div>

          {/* CTA */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 bg-primary rounded-full mb-2">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <p className="font-bold text-primary text-base">Scan & Review Us!</p>
            <p className="text-xs text-muted-foreground mt-1">Your feedback helps us serve you better</p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white/10 py-3 px-4 text-center relative z-10">
          <p className="text-sm font-medium text-white">www.merigaragereviews.com</p>
          <p className="text-xs text-white/70">India's Trusted Garage Review Platform</p>
        </div>
      </div>

      <Button onClick={downloadPoster} size="lg" className="gap-2 shadow-lg">
        <Download className="w-4 h-4" />
        Download Poster
      </Button>

      <p className="text-xs text-muted-foreground text-center max-w-[260px]">
        Print this poster & display it at your garage for customers to scan and leave reviews
      </p>
    </div>
  );
}

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
