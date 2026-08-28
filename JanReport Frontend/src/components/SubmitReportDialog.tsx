import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { MapPin, AlertCircle, X, Camera, Loader2, Upload, ScanText } from "lucide-react";
import { toast } from "sonner";
import { reportsAPI } from "../services/api";
import { CameraCaptureDialog } from "./CameraCaptureDialog";

interface SubmitReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (report: any) => void;
}

export function SubmitReportDialog({ open, onOpenChange, onSubmit }: SubmitReportDialogProps) {
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null); // Cloudinary URL
  const [loading, setLoading] = useState(false);
  const [extractingGeotag, setExtractingGeotag] = useState(false);
  const [ocrExtractedText, setOcrExtractedText] = useState<string>("");
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [reportSource, setReportSource] = useState<"geotag" | "camera">("geotag");
  const [cameraDialogOpen, setCameraDialogOpen] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setLocation("");
    setLatitude(null);
    setLongitude(null);
    setCategory("");
    setImagePreview(null);
    setImageUrl(null);
    setSelectedFileName("");
    setOcrExtractedText("");
    setExtractingGeotag(false);
    setReportSource("geotag");
  };

  const detectDeviceLocation = async () => {
    if (!navigator.geolocation) {
      return;
    }

    setDetectingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const detectedLat = position.coords.latitude;
        const detectedLng = position.coords.longitude;
        setLatitude(detectedLat);
        setLongitude(detectedLng);

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${detectedLat}&lon=${detectedLng}`
          );
          if (response.ok) {
            const data = await response.json();
            if (data?.display_name) {
              setLocation(data.display_name);
            }
          }
        } catch {
          setLocation(`${detectedLat.toFixed(5)}, ${detectedLng.toFixed(5)}`);
        } finally {
          setDetectingLocation(false);
        }
      },
      () => {
        setDetectingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Failed to read image file"));
      reader.readAsDataURL(file);
    });
  };

  const compressImageForOCR = async (sourceDataUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        if (!context) {
          reject(new Error("Could not initialize image processing"));
          return;
        }

        const maxDimension = 1600;
        const scaleRatio = Math.min(1, maxDimension / Math.max(image.width, image.height));
        canvas.width = Math.max(1, Math.round(image.width * scaleRatio));
        canvas.height = Math.max(1, Math.round(image.height * scaleRatio));

        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        let quality = 0.9;
        let output = canvas.toDataURL("image/jpeg", quality);

        while (output.length > 1_200_000 && quality > 0.35) {
          quality -= 0.1;
          output = canvas.toDataURL("image/jpeg", quality);
        }

        resolve(output);
      };

      image.onerror = () => reject(new Error("Failed to load image for OCR processing"));
      image.src = sourceDataUrl;
    });
  };

  const reverseGeocodeCoordinates = async (lat: number, lon: number): Promise<string | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
      );
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
      return data?.display_name || null;
    } catch {
      return null;
    }
  };

  const processGeotagImageWithOCR = async (base64Image: string) => {
    setExtractingGeotag(true);
    setOcrExtractedText("");

    try {
      const response = await fetch(`${API_BASE_URL}/ocr/parse-geotag`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ base64Image }),
      });

      const data = await response.json();
      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "OCR failed");
      }

      const parsedText = String(data?.data?.parsedText || "").trim();
      const parsedLat = typeof data?.data?.latitude === "number" ? data.data.latitude : null;
      const parsedLon = typeof data?.data?.longitude === "number" ? data.data.longitude : null;

      setOcrExtractedText(parsedText);

      if (parsedLat !== null && parsedLon !== null) {
        setLatitude(parsedLat);
        setLongitude(parsedLon);

        const resolvedLocation = await reverseGeocodeCoordinates(parsedLat, parsedLon);
        setLocation(resolvedLocation || `${parsedLat.toFixed(5)}, ${parsedLon.toFixed(5)}`);
        toast.success("Geo details extracted from image");
      } else {
        toast.info("OCR completed, but no GPS coordinates were detected. Please set location manually.");
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to extract geotag details");
    } finally {
      setExtractingGeotag(false);
    }
  };

  const handleGeotagFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file");
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      if (!dataUrl.startsWith("data:image/")) {
        toast.error("Invalid image format");
        return;
      }

      const ocrReadyImage = await compressImageForOCR(dataUrl);

      setReportSource("geotag");
      setSelectedFileName(file.name);
      setImagePreview(dataUrl);
      setImageUrl(null);

      await processGeotagImageWithOCR(ocrReadyImage);
    } catch {
      toast.error("Could not read uploaded image");
    } finally {
      event.target.value = "";
    }
  };

  useEffect(() => {
    if (!open) {
      resetForm();
      return;
    }
    if (reportSource === "camera") {
      detectDeviceLocation();
    }
  }, [open, reportSource]);

  const removeImage = () => {
    setImagePreview(null);
    setImageUrl(null);
    setSelectedFileName("");
    setOcrExtractedText("");
  };

  const handleCameraCapture = (imageDataUrl: string) => {
    // Validate imageDataUrl before proceeding
    if (!imageDataUrl || typeof imageDataUrl !== 'string') {
      toast.error("Invalid image data received");
      return false;
    }

    if (!imageDataUrl.startsWith('data:image/')) {
      console.error("Invalid image format received:", imageDataUrl.substring(0, 100));
      toast.error("Invalid image format. Please try capturing again.");
      return false;
    }

    // Set preview immediately for better UX; upload will happen on submit
    setReportSource("camera");
    setImagePreview(imageDataUrl);
    setImageUrl(null);
    toast.success("Photo captured successfully!");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !description || !location || !category) {
      toast.error("Please fill in all fields");
      return;
    }

    if (reportSource === "geotag" && !imagePreview) {
      toast.error("Upload a geotag photo first so location can be extracted.");
      return;
    }

    if (reportSource === "camera" && detectingLocation) {
      toast.error("Waiting for device location. Please wait a moment.");
      return;
    }

    setLoading(true);

    try {
      // If there's an image preview but no URL yet, submit captured image directly
      let finalImageUrl = imageUrl;
      if (imagePreview && !imageUrl) {
        finalImageUrl = imagePreview;
      }

      const reportData = {
        title,
        description,
        location,
        latitude,
        longitude,
        category,
        image: finalImageUrl || null, // Use Cloudinary URL instead of base64
      };

      // Submit to API
      const response = await reportsAPI.submitReport(reportData);

      // Call onSubmit callback if provided
      if (onSubmit) {
        onSubmit(response.data.report);
      }

      toast.success("Report submitted successfully! AI analysis in progress...", {
        description: "Your report will be reviewed by our moderation team",
      });

      // Reset form
      resetForm();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to submit report. Please try again.");
      console.error("Submit report error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="sm:max-w-[600px] w-[95vw] max-h-[90vh] p-0 overflow-y-auto flex flex-col"
          onPointerDownOutside={(event) => {
            if (cameraDialogOpen) {
              event.preventDefault();
            }
          }}
          onInteractOutside={(event) => {
            if (cameraDialogOpen) {
              event.preventDefault();
            }
          }}
          onEscapeKeyDown={(event) => {
            if (cameraDialogOpen) {
              event.preventDefault();
            }
          }}
        >
          <DialogHeader className="px-4 pt-4 pb-2 sm:px-6 sm:pt-6 sm:pb-4 shrink-0">
            <DialogTitle>Submit Local News Report</DialogTitle>
            <DialogDescription>
              Share important news from your community. All reports are moderated before publishing to ensure credibility.
            </DialogDescription>
          </DialogHeader>

          <form id="submit-report-form" onSubmit={handleSubmit} className="flex flex-col overflow-hidden flex-1 min-h-0">
            <div className="space-y-3 px-4 sm:px-6 overflow-y-auto flex-1 min-h-0 pb-3">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Breaking News">Breaking News</SelectItem>
                    <SelectItem value="Traffic">Traffic</SelectItem>
                    <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                    <SelectItem value="Public Safety">Public Safety</SelectItem>
                    <SelectItem value="Environment">Environment</SelectItem>
                    <SelectItem value="Community Event">Community Event</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Report Title</Label>
                <Input
                  id="title"
                  placeholder="Enter a clear, concise title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Provide detailed information about the incident or news..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <Tabs
                value={reportSource}
                onValueChange={(value) => {
                  const mode = value as "geotag" | "camera";
                  setReportSource(mode);
                  setImagePreview(null);
                  setImageUrl(null);
                  setSelectedFileName("");
                  setOcrExtractedText("");
                  setLatitude(null);
                  setLongitude(null);
                  setLocation("");
                }}
                className="space-y-3"
              >
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="geotag">Geotag Photo</TabsTrigger>
                  <TabsTrigger value="camera">Camera Capture</TabsTrigger>
                </TabsList>

                <TabsContent value="geotag" className="space-y-3 mt-0">
                  <div className="space-y-2">
                    <Label>Upload Geotag Photo</Label>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleGeotagFileChange}
                    />

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={extractingGeotag}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Select Geotag Image
                    </Button>

                    {extractingGeotag && (
                      <div className="flex items-center gap-2 text-sm text-blue-700">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Extracting geotag details using OCR...
                      </div>
                    )}

                    {selectedFileName && (
                      <p className="text-xs text-gray-600">Selected file: {selectedFileName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location-geotag">Location (From Geotag)</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="location-geotag"
                        placeholder="Upload a geotag photo to extract location"
                        value={location}
                        readOnly
                        className="pl-10 bg-gray-50"
                      />
                    </div>
                    <p className="text-xs text-gray-600">This field is populated from photo geotag extraction only.</p>
                  </div>

                  {ocrExtractedText && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-blue-900 mb-2">
                        <ScanText className="h-4 w-4" />
                        <p className="text-sm">OCR Extracted Text</p>
                      </div>
                      <p className="text-xs text-blue-800 whitespace-pre-wrap line-clamp-4">{ocrExtractedText}</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="camera" className="space-y-3 mt-0">
                  <div className="space-y-2">
                    <Label>Capture By Camera</Label>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => setCameraDialogOpen(true)}
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      Open Camera
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location-camera">Location (Device GPS)</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="location-camera"
                        placeholder={detectingLocation ? "Detecting device location..." : "Device location will appear here"}
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    {latitude !== null && longitude !== null && (
                      <p className="text-xs text-green-700">Using coordinates: {latitude.toFixed(5)}, {longitude.toFixed(5)}</p>
                    )}
                    {detectingLocation && (
                      <p className="text-xs text-blue-700">Detecting your device location...</p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              {imagePreview ? (
                <div className="relative border-2 rounded-lg overflow-hidden">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-32 sm:h-48 object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={removeImage}
                    disabled={extractingGeotag}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs">
                    {reportSource === "geotag" ? "Uploaded Geotag Photo" : "Camera Capture"}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-600">No photo selected yet.</p>
              )}

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800"><strong>AI Moderation:</strong> Your report will be analyzed by AI for misinformation patterns, then reviewed by our moderation team.</p>
              </div>
            </div>

            <div className="border-t bg-white px-4 py-3 sm:px-6 sm:py-4 flex justify-end gap-3 shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="submit-report-form"
                className="bg-red-600 hover:bg-red-700"
                disabled={loading || extractingGeotag}
              >
                {loading ? "Submitting..." : extractingGeotag ? "Extracting geotag..." : "Submit Report"}
              </Button>
            </div>
          </form>

        </DialogContent>
      </Dialog>

      {/* Camera Capture Dialog */}
      <CameraCaptureDialog
        open={cameraDialogOpen}
        onOpenChange={setCameraDialogOpen}
        onCapture={handleCameraCapture}
      />
    </>
  );
}
