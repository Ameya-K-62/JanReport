import { useEffect, useMemo, useState } from "react";
import { Filter, ChevronUp, ChevronDown, X } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import type { NewsReport } from "./NewsCard";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Fix for default marker icons in Leaflet with React
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapViewProps {
  reports: NewsReport[];
  selectedReportIdProp?: string | null;
  onClearSelection?: () => void;
}

interface ReportWithCoords extends NewsReport {
  lat: number;
  lng: number;
}

// Component to handle map center updates
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 13);
  }, [center, map]);
  return null;
}

function MapSizeFixer() {
  const map = useMap();

  useEffect(() => {
    const updateSize = () => {
      const container = map.getContainer();
      container.style.backgroundColor = "#e5e7eb";
      container.style.zIndex = "0";
      map.invalidateSize();
    };

    const timer = setTimeout(updateSize, 120);
    window.addEventListener("resize", updateSize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateSize);
    };
  }, [map]);

  return null;
}

export function MapView({ reports, selectedReportIdProp, onClearSelection }: MapViewProps) {
  const [selectedReport, setSelectedReport] = useState<ReportWithCoords | null>(null);
  const [geocodedCoords, setGeocodedCoords] = useState<Record<string, { lat: number; lng: number }>>({});
  const [isMobilePanelExpanded, setIsMobilePanelExpanded] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const handleClearSelection = () => {
    setSelectedReport(null);
    onClearSelection?.();
  };

  const handleShowAllReports = () => {
    setActiveCategory("All");
    handleClearSelection();
    setIsMobilePanelExpanded(false);
  };

  const reportsWithCoords = useMemo(() => {
    return reports
      .map((report) => {
        const lat = report.latitude ?? geocodedCoords[report.id]?.lat;
        const lng = report.longitude ?? geocodedCoords[report.id]?.lng;

        if (lat == null || lng == null) return null;

        return {
          ...report,
          lat,
          lng,
        } as ReportWithCoords;
      })
      .filter((report): report is ReportWithCoords => report !== null);
  }, [reports, geocodedCoords]);

  const categoryOptions = useMemo(() => {
    const uniqueCategories = Array.from(new Set(reports.map((report) => report.category).filter(Boolean)));
    return ["All", ...uniqueCategories];
  }, [reports]);

  const visibleReportsWithCoords = useMemo(() => {
    if (activeCategory === "All") return reportsWithCoords;
    return reportsWithCoords.filter((report) => report.category === activeCategory);
  }, [reportsWithCoords, activeCategory]);

  // Default center (Bangalore as per existing data context, or fallback to 0,0)
  const defaultCenter: [number, number] = [12.9716, 77.5946];

  // Auto-select report when selectedReportIdProp changes
  useEffect(() => {
    if (!selectedReportIdProp) {
      setSelectedReport(null);
      return;
    }

    const report = reports.find((r) => r.id === selectedReportIdProp);
    if (!report) {
      return;
    }

    const lat = report.latitude ?? geocodedCoords[report.id]?.lat;
    const lng = report.longitude ?? geocodedCoords[report.id]?.lng;

    if (lat != null && lng != null) {
      setSelectedReport({
        ...report,
        lat,
        lng,
      } as ReportWithCoords);
      return;
    }

    // Report might need geocoding, wait a bit for it to complete
    const timer = setTimeout(() => {
      const updatedLat = report.latitude ?? geocodedCoords[report.id]?.lat;
      const updatedLng = report.longitude ?? geocodedCoords[report.id]?.lng;

      if (updatedLat != null && updatedLng != null) {
        setSelectedReport({
          ...report,
          lat: updatedLat,
          lng: updatedLng,
        } as ReportWithCoords);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [selectedReportIdProp, reports, geocodedCoords]);

  useEffect(() => {
    const missingCoordReports = reports.filter(
      (report) =>
        (report.latitude == null || report.longitude == null) &&
        report.location &&
        !geocodedCoords[report.id]
    );

    if (missingCoordReports.length === 0) {
      return;
    }

    let cancelled = false;

    const geocodeMissingLocations = async () => {
      for (const report of missingCoordReports) {
        try {
          const response = await fetch(
            `${API_BASE_URL}/geocode?q=${encodeURIComponent(report.location)}`
          );

          if (!response.ok) {
            continue;
          }

          const json = await response.json();
          const result = json?.data;

          if (!cancelled && Array.isArray(result) && result[0]) {
            setGeocodedCoords((prev) => ({
              ...prev,
              [report.id]: {
                lat: Number(result[0].lat),
                lng: Number(result[0].lon),
              },
            }));
          }
        } catch {
          // silently fall back to no marker when geocoding fails
        }
      }
    };

    geocodeMissingLocations();

    return () => {
      cancelled = true;
    };
  }, [reports, geocodedCoords]);

  useEffect(() => {
    if (selectedReport) {
      setIsMobilePanelExpanded(true);
    }
    if (!selectedReportIdProp) {
      setSelectedReport(null);
      return;
    }

    const report = reports.find((r) => r.id === selectedReportIdProp);
    if (!report) {
      return;
    }

    const lat = report.latitude ?? geocodedCoords[report.id]?.lat;
    const lng = report.longitude ?? geocodedCoords[report.id]?.lng;

    if (lat != null && lng != null) {
      setSelectedReport({
        ...report,
        lat,
        lng,
      } as ReportWithCoords);
      return;
    }

    // Report might need geocoding, wait a bit for it to complete
    const timer = setTimeout(() => {
      const updatedLat = report.latitude ?? geocodedCoords[report.id]?.lat;
      const updatedLng = report.longitude ?? geocodedCoords[report.id]?.lng;

      if (updatedLat != null && updatedLng != null) {
        setSelectedReport({
          ...report,
          lat: updatedLat,
          lng: updatedLng,
        } as ReportWithCoords);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [selectedReportIdProp, reports, geocodedCoords]);

  const initialCenter = visibleReportsWithCoords[0]
    ? [visibleReportsWithCoords[0].lat, visibleReportsWithCoords[0].lng] as [number, number]
    : defaultCenter;

  const mapCenter = selectedReport
    ? [selectedReport.lat, selectedReport.lng] as [number, number]
    : initialCenter;

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col md:flex-row bg-white relative isolate">
      {/* Map Area - Full screen on mobile, flex-1 on desktop */}
      <div className="flex-1 relative z-0 bg-gray-100 overflow-hidden">
        <MapContainer
          key="map-container"
          center={initialCenter}
          zoom={12}
          className="h-full w-full z-0"
          style={{ height: "100%", width: "100%" }}
          zoomControl={true}
          scrollWheelZoom={true}
        >
          <TileLayer
            key="tile-layer"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapUpdater center={mapCenter} />
          <MapSizeFixer />

          {visibleReportsWithCoords.length > 0 && (
            visibleReportsWithCoords.map((report) => (
              <Marker
                key={`marker-${report.id}`}
                position={[report.lat, report.lng]}
                eventHandlers={{
                  click: () => {
                    setSelectedReport(report);
                    setIsMobilePanelExpanded(true);
                  },
                }}
              >
                <Popup>
                  <div className="min-w-[200px]">
                    <h3 className="font-bold text-sm mb-1">{report.title}</h3>
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">{report.description}</p>
                    <Badge variant="outline" className="text-xs">{report.category}</Badge>
                  </div>
                </Popup>
              </Marker>
            ))
          )}
        </MapContainer>

        {/* Map legend overlay */}
        <div className="absolute top-4 left-4 z-40 bg-white rounded-lg shadow-lg p-3 space-y-2 pointer-events-auto">
          <div className="flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-4 bg-blue-500 rounded-t-full rounded-b-none border border-blue-600"></div>
              <span className="text-sm font-medium">Reports</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={handleShowAllReports}
            >
              Show all
            </Button>
          </div>
          <p className="text-xs text-gray-500">{visibleReportsWithCoords.length} located reports</p>
        </div>

        {/* Filter button overlay */}
        <div className="absolute top-4 right-4 z-40 pointer-events-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="bg-white text-gray-900 hover:bg-gray-100 shadow-lg"
                size="sm"
              >
                <Filter className="h-4 w-4 mr-2" />
                {activeCategory === "All" ? "Filter" : activeCategory}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Filter by category</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={activeCategory} onValueChange={setActiveCategory}>
                {categoryOptions.map((category) => (
                  <DropdownMenuRadioItem key={category} value={category}>
                    {category}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden md:flex w-96 bg-white border-l overflow-y-auto z-10 shadow-xl max-h-[calc(100vh-64px)] flex-col">
        {selectedReport ? (
          <div className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShowAllReports}
              >
                ← Show all reports
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClearSelection}
                aria-label="Close report"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

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
                  <span>📍</span>
                  <span>{selectedReport.location}</span>
                </div>

                <h3 className="mb-2 font-bold text-lg">{selectedReport.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{selectedReport.description}</p>

                <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
                  <span>By @{selectedReport.author}</span>
                  <span>{selectedReport.timestamp}</span>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <div className="p-4 flex-1 overflow-y-auto">
            <h3 className="mb-4 font-semibold text-lg">Recent Reports</h3>
            {visibleReportsWithCoords.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No reports with valid coordinates found yet.</p>
            ) : (
              <div className="space-y-3">
                {visibleReportsWithCoords.map((report) => (
                  <div
                    key={report.id}
                    onClick={() => setSelectedReport(report)}
                    className="cursor-pointer"
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
                          <h4 className="text-sm font-medium mb-1 line-clamp-2">{report.title}</h4>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <span className="truncate">📍 {report.location}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Floating Collapsible Panel */}
      <div
        className="md:hidden fixed left-3 right-3 z-50 pointer-events-auto"
        style={{ zIndex: 999, bottom: "calc(5.5rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <div
          className="pointer-events-auto bg-white/95 backdrop-blur rounded-xl shadow-xl border overflow-hidden"
          onPointerDown={(event) => event.stopPropagation()}
          onTouchStart={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => setIsMobilePanelExpanded((prev) => !prev)}
            className="w-full p-4 flex items-center justify-between text-left"
            aria-expanded={isMobilePanelExpanded}
          >
            <div className="pr-3">
              {selectedReport ? (
                <h3 className="font-semibold text-sm line-clamp-1">{selectedReport.title}</h3>
              ) : (
                <h3 className="font-semibold text-sm">{visibleReportsWithCoords.length} Reports</h3>
              )}
            </div>
            {isMobilePanelExpanded ? (
              <ChevronDown className="h-5 w-5 text-gray-600 shrink-0" />
            ) : (
              <ChevronUp className="h-5 w-5 text-gray-600 shrink-0" />
            )}
          </button>

          {isMobilePanelExpanded && (
            <div className="max-h-[65vh] overflow-y-auto border-t p-3 space-y-3">
              <div className="sticky top-0 z-10 pb-2 bg-white/95 backdrop-blur flex items-center justify-between">
                {selectedReport ? (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleShowAllReports}
                      className="text-sm"
                    >
                      ← Show all reports
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleClearSelection}
                      aria-label="Close report"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between w-full text-xs text-gray-500">
                    <span>Tap a report to view details</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleShowAllReports}
                      className="text-xs"
                    >
                      Show all
                    </Button>
                  </div>
                )}
              </div>
              {selectedReport ? (
                <div>
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
                        <span>📍</span>
                        <span>{selectedReport.location}</span>
                      </div>

                      <h3 className="mb-2 font-bold text-lg">{selectedReport.title}</h3>
                      <p className="text-sm text-gray-600 mb-4">{selectedReport.description}</p>

                      <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
                        <span>By @{selectedReport.author}</span>
                        <span>{selectedReport.timestamp}</span>
                      </div>
                    </div>
                  </Card>
                </div>
              ) : (
                <div>
                  <h3 className="mb-3 font-semibold text-base">Recent Reports</h3>
                  {visibleReportsWithCoords.length === 0 ? (
                    <p className="text-gray-500 text-center py-6">No reports with valid coordinates found yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {visibleReportsWithCoords.map((report) => (
                        <div
                          key={report.id}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setSelectedReport(report);
                              setIsMobilePanelExpanded(true);
                            }
                          }}
                          onClick={() => {
                            setSelectedReport(report);
                            setIsMobilePanelExpanded(true);
                            onClearSelection?.();
                          }}
                          className="cursor-pointer"
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
                                <h4 className="text-sm font-medium mb-1 line-clamp-2">{report.title}</h4>
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <span className="truncate">📍 {report.location}</span>
                                </div>
                              </div>
                            </div>
                          </Card>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

