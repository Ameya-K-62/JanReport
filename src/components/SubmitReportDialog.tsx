import { useState, useRef } from "react";
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
import { MapPin, Image as ImageIcon, AlertCircle, X, Upload } from "lucide-react";
import { toast } from "sonner@2.0.3";

interface SubmitReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (report: any) => void;
}

export function SubmitReportDialog({ open, onOpenChange, onSubmit }: SubmitReportDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      
      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !description || !location || !category) {
      toast.error("Please fill in all fields");
      return;
    }

    const reportData = {
      title,
      description,
      location,
      category,
      image: imagePreview,
      timestamp: new Date().toISOString(),
    };

    // Call onSubmit callback if provided
    if (onSubmit) {
      onSubmit(reportData);
    }

    // Mock submission - simulate AI moderation
    toast.success("Report submitted successfully! AI analysis in progress...", {
      description: "Your report will be reviewed by our moderation team",
    });
    
    // Reset form
    setTitle("");
    setDescription("");
    setLocation("");
    setCategory("");
    removeImage();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Submit Local News Report</DialogTitle>
          <DialogDescription>
            Share important news from your community. All reports are moderated before publishing to ensure credibility.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
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
              rows={5}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="location"
                placeholder="Enter location (e.g., MG Road, Bangalore)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Upload Image/Video (Optional)</Label>
            {imagePreview ? (
              <div className="relative border-2 rounded-lg overflow-hidden">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-full h-48 object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
                <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs">
                  {imageFile?.name}
                </div>
              </div>
            ) : (
              <div 
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-red-500 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG, MP4 up to 10MB</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              id="image"
              type="file"
              accept="image/*,video/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p><strong>AI Moderation:</strong> Your report will be analyzed by AI (BERT NLP & ResNet50) for misinformation patterns, then reviewed by our moderation team. This usually takes 10-30 minutes.</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-red-600 hover:bg-red-700">
              Submit Report
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
