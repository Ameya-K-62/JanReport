import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { MapPin, Eye, Heart, MessageCircle, Share2, Clock, Trash2, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { ImageWithFallback } from "./figma/ImageWithFallback";

export interface NewsReport {
  id: string;
  title: string;
  description: string;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  image: string;
  author: string;
  timestamp: string;
  views: number;
  likes: number;
  comments: number;
  status: "pending" | "approved" | "rejected";
  category: string;

  // ✅ OPTIONAL AI FIELDS (future use, no break)
  sentiment?: {
    label: string;
    confidence: number;
  };
  imageAnalysis?: {
    result: string;
  };
  severityScore?: number;
}

interface NewsCardProps {
  report: NewsReport;
  onClick?: () => void;
  onDelete?: (reportId: string) => void;

  // ✅ NEW PROP (SAFE)
  onAIInsights?: (report: NewsReport) => void;
}

export function NewsCard({ report, onClick, onDelete, onAIInsights }: NewsCardProps) {
  return (
    <Card
      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="relative aspect-video overflow-hidden bg-gray-100">
        <ImageWithFallback
          src={report.image}
          alt={report.title}
          className="w-full h-full object-cover"
        />
        <Badge className="absolute top-3 left-3 bg-red-600 hover:bg-red-700">
          {report.category}
        </Badge>
        {report.status === "pending" && (
          <Badge className="absolute top-3 right-3 bg-yellow-500 hover:bg-yellow-600">
            Pending Review
          </Badge>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          <MapPin className="h-4 w-4" />
          <span>{report.location}</span>
        </div>

        <h3 className="mb-2 line-clamp-2">{report.title}</h3>

        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {report.description}
        </p>

        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
          <span>By @{report.author}</span>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{report.timestamp}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 pt-3 border-t flex-wrap">
          <Button variant="ghost" size="sm" className="gap-1 h-8 px-2">
            <Eye className="h-4 w-4" />
            <span className="text-xs">{report.views}</span>
          </Button>
          <Button variant="ghost" size="sm" className="gap-1 h-8 px-2">
            <Heart className="h-4 w-4" />
            <span className="text-xs">{report.likes}</span>
          </Button>
          <Button variant="ghost" size="sm" className="gap-1 h-8 px-2">
            <MessageCircle className="h-4 w-4" />
            <span className="text-xs">{report.comments}</span>
          </Button>

          {/* ✅ AI INSIGHTS BUTTON (NEW) */}
          {onAIInsights && (
            <Button
              variant="secondary"
              size="sm"
              className="gap-1 h-8 px-2"
              onClick={(event: React.MouseEvent) => {
                event.stopPropagation(); // 🔥 VERY IMPORTANT
                onAIInsights(report);
              }}
            >
              <Sparkles className="h-4 w-4" />
              <span className="text-xs">AI</span>
            </Button>
          )}

          <Button variant="ghost" size="sm" className="gap-1 h-8 px-2 ml-auto">
            <Share2 className="h-4 w-4" />
          </Button>

          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 h-8 px-2 text-red-600 hover:text-red-700"
              onClick={(event: React.MouseEvent) => {
                event.stopPropagation();
                onDelete(report.id);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}