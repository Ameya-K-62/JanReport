import { Badge } from "./ui/badge";
import { MapPin, Heart, MessageCircle, Share2, Clock, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import type { NewsReport } from "./NewsCard";

interface NewsPostProps {
  report: NewsReport;
  onClick?: () => void;
  onDelete?: (reportId: string) => void;
}

export function NewsPost({ report, onClick, onDelete }: NewsPostProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border mb-4 overflow-hidden" onClick={onClick}>
      {/* Header */}
      <div className="p-4 pb-2">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-red-100 text-red-600">
              {report.author.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm">@{report.author}</span>
              <Badge variant="outline" className="text-xs">
                {report.category}
              </Badge>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
              <MapPin className="h-3 w-3" />
              <span>{report.location}</span>
              <span className="mx-1">•</span>
              <Clock className="h-3 w-3" />
              <span>{report.timestamp}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <h3 className="mb-1">{report.title}</h3>
        <p className="text-sm text-gray-600">{report.description}</p>
      </div>

      {/* Image */}
      <div className="relative w-full aspect-video bg-gray-100">
        <ImageWithFallback
          src={report.image}
          alt={report.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Actions */}
      <div className="px-4 py-3 flex items-center justify-between border-t">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="gap-1 h-8 px-3">
            <Heart className="h-4 w-4" />
            <span className="text-xs">{report.likes}</span>
          </Button>
          <Button variant="ghost" size="sm" className="gap-1 h-8 px-3">
            <MessageCircle className="h-4 w-4" />
            <span className="text-xs">{report.comments}</span>
          </Button>
        </div>
        <Button variant="ghost" size="sm" className="gap-1 h-8 px-3">
          <Share2 className="h-4 w-4" />
          <span className="text-xs">Share</span>
        </Button>
        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 h-8 px-3 text-red-600 hover:text-red-700"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(report.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
            <span className="text-xs">Delete</span>
          </Button>
        )}
      </div>
    </div>
  );
}
