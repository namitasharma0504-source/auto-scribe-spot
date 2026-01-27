import { useState } from "react";
import { X, Download, ExternalLink, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DocumentPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentUrl: string | null;
  documentTitle: string;
}

export function DocumentPreviewModal({
  open,
  onOpenChange,
  documentUrl,
  documentTitle,
}: DocumentPreviewModalProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const isPdf = documentUrl?.toLowerCase().includes('.pdf');

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const resetView = () => {
    setZoom(1);
    setRotation(0);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      resetView();
      setIsLoading(true);
    }
    onOpenChange(isOpen);
  };

  if (!documentUrl) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-4 py-3 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg">{documentTitle}</DialogTitle>
            <div className="flex items-center gap-2">
              {!isPdf && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleZoomOut}
                    disabled={zoom <= 0.5}
                    title="Zoom Out"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground min-w-[3rem] text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleZoomIn}
                    disabled={zoom >= 3}
                    title="Zoom In"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRotate}
                    title="Rotate"
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                size="icon"
                asChild
                title="Open in new tab"
              >
                <a href={documentUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                asChild
                title="Download"
              >
                <a href={documentUrl} download>
                  <Download className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto bg-muted/30 flex items-center justify-center p-4">
          {isPdf ? (
            <iframe
              src={documentUrl}
              className="w-full h-full rounded border bg-white"
              title={documentTitle}
            />
          ) : (
            <div
              className="relative flex items-center justify-center"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transition: "transform 0.2s ease",
              }}
            >
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              )}
              <img
                src={documentUrl}
                alt={documentTitle}
                className="max-w-full max-h-full object-contain rounded shadow-lg"
                onLoad={() => setIsLoading(false)}
                onError={() => setIsLoading(false)}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
