import { useState } from "react";
import { MapPin, Filter } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import type { NewsReport } from "./NewsCard";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface MapViewProps {
  reports: NewsReport[];
}

export function MapView({ reports }: MapViewProps) {
  const [selectedReport, setSelectedReport] = useState<NewsReport | null>(null);

  // Mock map coordinates for reports
  const reportsWithCoords = reports.slice(0, 6).map((report, index) => ({
    ...report,
    lat: 20 + index * 2,
    lng: 20 + index * 3,
  }));

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col md:flex-row">
      {/* Map Area */}
      <div className="flex-1 relative bg-gray-100">
        {/* Mock map background */}
        <div className="w-full h-full relative bg-gradient-to-br from-gray-200 to-gray-300">
          <div className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `repeating-linear-gradient(0deg, #888 0px, #888 1px, transparent 1px, transparent 30px),
                               repeating-linear-gradient(90deg, #888 0px, #888 1px, transparent 1px, transparent 30px)`,
            }}
          />
          
          {/* Map pins */}
          {reportsWithCoords.map((report) => (
            <button
              key={report.id}
              className="absolute transform -translate-x-1/2 -translate-y-full hover:scale-110 transition-transform"
              style={{
                left: `${report.lng}%`,
                top: `${report.lat}%`,
              }}
              onClick={() => setSelectedReport(report)}
            >
              <div className="relative">
                <MapPin className="h-8 w-8 fill-red-600 text-red-600 drop-shadow-lg" />
                <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full" />
              </div>
            </button>
          ))}

          {/* Map legend */}
          <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 fill-red-600 text-red-600" />
              <span className="text-sm">Active Reports</span>
            </div>
            <p className="text-xs text-gray-500">{reports.length} total reports</p>
          </div>

          {/* Filter button */}
          <Button
            className="absolute top-4 right-4 bg-white text-gray-900 hover:bg-gray-100 shadow-lg"
            size="sm"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Sidebar with selected report or list */}
      <div className="w-full md:w-96 bg-white border-l overflow-y-auto">
        {selectedReport ? (
          <div className="p-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedReport(null)}
              className="mb-4"
            >
              ← Back to list
            </Button>
            
            <Card className="overflow-hidden">
              <div className="relative aspect-video">
                <ImageWithFallback
                  src={selectedReport.image}
                  alt={selectedReport.title}
                  className="w-full h-full object-cover"
                />
                <Badge className="absolute top-2 left-2 bg-red-600">
                  {selectedReport.category}
                </Badge>
              </div>
              
              <div className="p-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <MapPin className="h-4 w-4" />
                  <span>{selectedReport.location}</span>
                </div>
                
                <h3 className="mb-2">{selectedReport.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{selectedReport.description}</p>
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>By @{selectedReport.author}</span>
                  <span>{selectedReport.timestamp}</span>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <div className="p-4">
            <h3 className="mb-4">Recent Reports</h3>
            <div className="space-y-3">
              {reports.slice(0, 8).map((report) => (
                <button
                  key={report.id}
                  onClick={() => setSelectedReport(report)}
                  className="w-full text-left"
                >
                  <Card className="p-3 hover:shadow-md transition-shadow">
                    <div className="flex gap-3">
                      <div className="relative w-20 h-20 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                        <ImageWithFallback
                          src={report.image}
                          alt={report.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Badge variant="outline" className="text-xs mb-1">
                          {report.category}
                        </Badge>
                        <h4 className="text-sm mb-1 line-clamp-2">{report.title}</h4>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{report.location}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
