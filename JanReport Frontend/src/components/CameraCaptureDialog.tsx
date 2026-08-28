import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Camera, X, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface CameraCaptureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (imageDataUrl: string) => boolean | Promise<boolean>;
}

export function CameraCaptureDialog({
  open,
  onOpenChange,
  onCapture,
}: CameraCaptureDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [videoReady, setVideoReady] = useState(false);

  // Start camera when dialog opens
  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopCamera();
    }

    // Cleanup on unmount
    return () => {
      stopCamera();
    };
  }, [open, facingMode]);

  useEffect(() => {
    if (!open || !stream || !videoRef.current) {
      return;
    }

    let cancelled = false;
    const videoElement = videoRef.current;

    const markReady = () => {
      if (cancelled) {
        return;
      }
      setVideoReady(true);
      setIsCapturing(false);
      setError(null);
    };

    const handleVideoError = () => {
      if (cancelled) {
        return;
      }
      setError("Failed to start camera preview");
      setIsCapturing(false);
      setVideoReady(false);
    };

    videoElement.srcObject = stream;
    videoElement.onloadedmetadata = () => {
      videoElement
        .play()
        .then(() => {
          if (videoElement.readyState >= 2) {
            markReady();
          }
        })
        .catch(handleVideoError);
    };

    videoElement.oncanplay = markReady;

    if (videoElement.readyState >= 2) {
      markReady();
    }

    return () => {
      cancelled = true;
      if (videoRef.current) {
        videoRef.current.onloadedmetadata = null;
        videoRef.current.oncanplay = null;
      }
    };
  }, [open, stream]);

  const startCamera = async () => {
    try {
      setError(null);
      setIsCapturing(true);
      setVideoReady(false);

      // Check if MediaDevices API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          "Camera access is not supported in this browser. Please use a modern browser or upload an image file instead."
        );
      }

      // Request camera access
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = mediaStream;
      setStream(mediaStream);
    } catch (err: any) {
      console.error("Camera access error:", err);
      let errorMessage = "Failed to access camera. ";

      if (err.name === "NotAllowedError") {
        errorMessage += "Please allow camera access in your browser settings.";
      } else if (err.name === "NotFoundError") {
        errorMessage += "No camera found on your device.";
      } else if (err.name === "NotReadableError") {
        errorMessage += "Camera is already in use by another application.";
      } else if (err.name === "OverconstrainedError") {
        errorMessage += "Camera doesn't support the requested settings.";
      } else {
        errorMessage += err.message || "Unknown error occurred.";
      }

      setError(errorMessage);
      toast.error(errorMessage);
      setIsCapturing(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
    }

    streamRef.current = null;
    setStream(null);

    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.onloadedmetadata = null;
      videoRef.current.oncanplay = null;
    }

    setIsCapturing(false);
    setVideoReady(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) {
      toast.error("Camera not ready. Please wait...");
      return;
    }

    if (!videoReady) {
      toast.error("Camera is still initializing. Please wait...");
      return;
    }

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (!context) {
        toast.error("Failed to capture image - canvas context unavailable");
        return;
      }

      // Ensure video has valid dimensions and is playing
      if (video.readyState < 2) {
        toast.error("Video not ready. Please wait a moment and try again.");
        return;
      }

      if (video.videoWidth === 0 || video.videoHeight === 0) {
        toast.error("Video dimensions not available. Please wait...");
        return;
      }

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Clear canvas first
      context.clearRect(0, 0, canvas.width, canvas.height);

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Validate canvas has content
      if (canvas.width === 0 || canvas.height === 0) {
        toast.error("Failed to capture image - invalid canvas size");
        return;
      }

      // Convert canvas to base64 image - ensure proper format
      let imageDataUrl: string;
      try {
        imageDataUrl = canvas.toDataURL("image/jpeg", 0.9);
      } catch (err) {
        console.error("Error converting canvas to data URL:", err);
        toast.error("Failed to process image. Please try again.");
        return;
      }

      // Validate the data URL format
      if (!imageDataUrl || typeof imageDataUrl !== 'string') {
        console.error("Invalid data URL - not a string");
        toast.error("Failed to generate image. Please try again.");
        return;
      }

      if (!imageDataUrl.startsWith("data:image/")) {
        console.error("Invalid data URL format. First 100 chars:", imageDataUrl.substring(0, 100));
        toast.error("Failed to generate image format. Please try again.");
        return;
      }

      // Ensure it has base64 data
      const commaIndex = imageDataUrl.indexOf(',');
      if (commaIndex === -1 || imageDataUrl.substring(commaIndex + 1).length === 0) {
        console.error("Invalid data URL - missing base64 data");
        toast.error("Failed to generate image data. Please try again.");
        return;
      }

      // Call the onCapture callback with the captured image
      const captureAccepted = await Promise.resolve(onCapture(imageDataUrl));

      if (!captureAccepted) {
        return;
      }

      // Stop camera and close dialog
      stopCamera();
      setVideoReady(false);
      onOpenChange(false);
    } catch (err: any) {
      console.error("Capture error:", err);
      toast.error("Failed to capture photo. Please try again.");
    }
  };

  const switchCamera = () => {
    // Stop current stream before switching
    stopCamera();
    setVideoReady(false);
    // Switch facing mode - useEffect will restart camera
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  const handleClose = () => {
    stopCamera();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose} modal={false}>
      <DialogContent className="sm:max-w-[700px] w-[95vw] max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>Capture Photo</DialogTitle>
          <DialogDescription>
            Allow camera access to capture a photo for your report
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 pb-6">
          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={startCamera}
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          ) : (
            <>
              {/* Video Preview */}
              <div className="relative bg-black rounded-lg overflow-hidden w-full" style={{ height: '500px', maxHeight: '50vh' }}>
                {stream ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="absolute inset-0 w-full h-full"
                      style={{ objectFit: 'cover' }}
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    {/* Camera controls overlay */}
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 z-10">
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        onClick={switchCamera}
                        className="bg-white/80 hover:bg-white"
                        title="Switch camera"
                        disabled={!videoReady}
                      >
                        <RotateCcw className="h-5 w-5" />
                      </Button>
                      <Button
                        type="button"
                        onClick={capturePhoto}
                        size="lg"
                        className="bg-red-600 hover:bg-red-700 h-16 w-16 rounded-full disabled:opacity-50"
                        title="Capture photo"
                        disabled={!videoReady}
                      >
                        <Camera className="h-6 w-6" />
                      </Button>
                    </div>
                    {!videoReady && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
                        <div className="text-center text-white">
                          <Camera className="h-12 w-12 mx-auto mb-2 opacity-50 animate-pulse" />
                          <p className="text-sm">Initializing camera...</p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full absolute inset-0">
                    <div className="text-center text-white">
                      <Camera className="h-12 w-12 mx-auto mb-2 opacity-50 animate-pulse" />
                      <p className="text-sm">Starting camera...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                <p>
                  <strong>Instructions:</strong> Position your camera and click
                  the capture button to take a photo. You can switch between
                  front and back cameras using the rotate button.
                </p>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isCapturing && !error}
            >
              Cancel
            </Button>
            {!error && stream && videoReady && (
              <Button
                type="button"
                onClick={capturePhoto}
                className="bg-red-600 hover:bg-red-700"
              >
                <Camera className="mr-2 h-4 w-4" />
                Capture Photo
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
