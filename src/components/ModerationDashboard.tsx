import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { AlertTriangle, CheckCircle2, XCircle, Edit, MapPin, Clock, Brain, Camera, Zap } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { toast } from "sonner@2.0.3";

interface AIAnalysis {
  bertNlp: {
    confidence: number;
    result: string;
  };
  resnet50: {
    confidence: number;
    result: string;
  };
  errorLevelAnalysis: {
    result: string;
  };
}

interface PendingReport {
  id: string;
  title: string;
  description: string;
  location: string;
  category: string;
  image?: string;
  author: string;
  timestamp: string;
  aiAnalysis: AIAnalysis;
  priority: "high" | "medium" | "low";
  suspicionLevel: "suspicious" | "unverified" | "potential";
}

const mockPendingReports: PendingReport[] = [
  {
    id: "p1",
    title: "Government Building on Fire - Multiple Casualties Reported",
    description: "Unverified reports of major fire incident at government building with claimed casualties. Image analysis shows possible manipulation.",
    location: "City Center, Bangalore",
    image: "https://images.unsplash.com/photo-1532300481631-0bc14f3b7699?w=800",
    author: "anonymous_user",
    timestamp: "15 min ago",
    priority: "high",
    suspicionLevel: "suspicious",
    aiAnalysis: {
      bertNlp: {
        confidence: 87,
        result: "87% match with known misinformation patterns (BERT model)"
      },
      resnet50: {
        confidence: 73,
        result: "Image shows signs of manipulation (Error Level Analysis)"
      },
      errorLevelAnalysis: {
        result: "Location doesn't match EXIF data"
      }
    }
  },
  {
    id: "p2",
    title: "Local Business Closing Without Notice",
    description: "Report claims popular restaurant is closing without evidence. Need verification from business owner.",
    location: "Indiranagar, Bangalore",
    author: "concerned_citizen",
    timestamp: "1 hour ago",
    priority: "medium",
    suspicionLevel: "unverified",
    aiAnalysis: {
      bertNlp: {
        confidence: 45,
        result: "Requires fact-checking - no supporting sources found"
      },
      resnet50: {
        confidence: 12,
        result: "No image provided for analysis"
      },
      errorLevelAnalysis: {
        result: "Location information needs verification"
      }
    }
  },
  {
    id: "p3",
    title: "Water Contamination Alert in HSR Layout Area",
    description: "Medical claims about local water supply contamination need fact-checking and official verification.",
    location: "HSR Layout, Bangalore",
    image: "https://images.unsplash.com/photo-1630879514309-378dc2f9e866?w=800",
    author: "health_alert",
    timestamp: "2 hours ago",
    priority: "medium",
    suspicionLevel: "potential",
    aiAnalysis: {
      bertNlp: {
        confidence: 62,
        result: "Contains medical claims requiring expert verification"
      },
      resnet50: {
        confidence: 89,
        result: "Image appears authentic (no manipulation detected)"
      },
      errorLevelAnalysis: {
        result: "Need official health department confirmation"
      }
    }
  }
];

export function ModerationDashboard() {
  const [activeTab, setActiveTab] = useState("pending");
  const [reports, setReports] = useState(mockPendingReports);

  const handleAction = (reportId: string, action: "approve" | "reject" | "edit") => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    if (action === "approve") {
      toast.success(`Report "${report.title.substring(0, 30)}..." approved and published`);
      setReports(reports.filter(r => r.id !== reportId));
    } else if (action === "reject") {
      toast.error(`Report "${report.title.substring(0, 30)}..." rejected`);
      setReports(reports.filter(r => r.id !== reportId));
    } else if (action === "edit") {
      toast.info(`Opening editor for "${report.title.substring(0, 30)}..."`);
    }
  };

  const getSuspicionColor = (level: string) => {
    switch (level) {
      case "suspicious": return "bg-red-100 text-red-800 border-red-300";
      case "unverified": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "potential": return "bg-blue-100 text-blue-800 border-blue-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high": return <Badge className="bg-red-500">High Priority</Badge>;
      case "medium": return <Badge className="bg-yellow-500">Medium Priority</Badge>;
      case "low": return <Badge className="bg-blue-500">Review Needed</Badge>;
      default: return null;
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="mb-2">Moderation Dashboard</h2>
          <p className="text-sm text-gray-600">
            Using: BERT NLP | ResNet50 | Error Level Analysis
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="pending" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              Pending ({reports.length})
            </TabsTrigger>
            <TabsTrigger value="approved" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Approved
            </TabsTrigger>
            <TabsTrigger value="rejected" className="gap-2">
              <XCircle className="h-4 w-4" />
              Rejected
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6">
            {reports.length === 0 ? (
              <Card className="p-12 text-center">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <h3 className="mb-2">All Caught Up!</h3>
                <p className="text-gray-600">No pending reports to review</p>
              </Card>
            ) : (
              <div className="space-y-6">
                {reports.map((report) => (
                  <Card key={report.id} className="overflow-hidden">
                    <div className={`border-l-4 p-6 ${
                      report.suspicionLevel === "suspicious" ? "border-red-500" :
                      report.suspicionLevel === "unverified" ? "border-yellow-500" :
                      "border-blue-500"
                    }`}>
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getPriorityBadge(report.priority)}
                            <Badge variant="outline" className={getSuspicionColor(report.suspicionLevel)}>
                              {report.suspicionLevel === "suspicious" ? "Suspicious Content Detected" :
                               report.suspicionLevel === "unverified" ? "Unverified Claims" :
                               "Potential Misinformation"}
                            </Badge>
                          </div>
                          <h3 className="mb-2">{report.title}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span>{report.location}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{report.timestamp}</span>
                            </div>
                            <span>By @{report.author}</span>
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <p className="text-sm text-gray-700 mb-4">{report.description}</p>
                          {report.image && (
                            <div className="rounded-lg overflow-hidden border">
                              <ImageWithFallback
                                src={report.image}
                                alt={report.title}
                                className="w-full h-48 object-cover"
                              />
                            </div>
                          )}
                        </div>

                        {/* AI Analysis */}
                        <div className="space-y-3">
                          <h4 className="text-sm flex items-center gap-2 mb-3">
                            <Zap className="h-4 w-4 text-purple-600" />
                            AI Scrutiny Results
                          </h4>

                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                            <div className="flex items-start gap-2 mb-2">
                              <Brain className="h-4 w-4 text-purple-600 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-xs text-purple-900 mb-1">BERT NLP Analysis</p>
                                <p className="text-sm text-purple-800">
                                  {report.aiAnalysis.bertNlp.result}
                                </p>
                                <div className="mt-2 bg-purple-200 rounded-full h-2">
                                  <div 
                                    className="bg-purple-600 h-2 rounded-full"
                                    style={{ width: `${report.aiAnalysis.bertNlp.confidence}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {report.image && (
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                              <div className="flex items-start gap-2 mb-2">
                                <Camera className="h-4 w-4 text-orange-600 mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-xs text-orange-900 mb-1">ResNet50 Image Analysis</p>
                                  <p className="text-sm text-orange-800">
                                    {report.aiAnalysis.resnet50.result}
                                  </p>
                                  <div className="mt-2 bg-orange-200 rounded-full h-2">
                                    <div 
                                      className="bg-orange-600 h-2 rounded-full"
                                      style={{ width: `${report.aiAnalysis.resnet50.confidence}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="h-4 w-4 text-gray-600 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-xs text-gray-900 mb-1">Additional Notes</p>
                                <p className="text-sm text-gray-700">
                                  {report.aiAnalysis.errorLevelAnalysis.result}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3 pt-4 border-t">
                        <Button
                          variant="destructive"
                          onClick={() => handleAction(report.id, "reject")}
                          className="flex-1"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Reject
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleAction(report.id, "edit")}
                          className="flex-1"
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          onClick={() => handleAction(report.id, "approve")}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Approve
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved" className="mt-6">
            <Card className="p-12 text-center">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <h3 className="mb-2">No Approved Reports</h3>
              <p className="text-gray-600">Approved reports will appear here</p>
            </Card>
          </TabsContent>

          <TabsContent value="rejected" className="mt-6">
            <Card className="p-12 text-center">
              <XCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <h3 className="mb-2">No Rejected Reports</h3>
              <p className="text-gray-600">Rejected reports will appear here</p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
