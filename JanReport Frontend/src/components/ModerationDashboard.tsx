import { useState, useEffect } from "react";
import axios from "axios";

import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Textarea } from "./ui/textarea";

import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MapPin,
  Clock,
  Brain,
  Camera
} from "lucide-react";

import { ImageWithFallback } from "./figma/ImageWithFallback";
import { toast } from "sonner";
import { reportsAPI, formatTimestamp } from "../services/api";

export function ModerationDashboard() {

  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [reason, setReason] = useState("");

  const [verdicts, setVerdicts] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await reportsAPI.getModerationReports("pending");

      const transformed = response.data.reports.map((report: any) => ({
        id: report.id,
        title: report.title,
        description: report.description,
        location: report.location,
        category: report.category,
        image: report.image || undefined,
        author: report.author?.split("@")[0] || "anonymous",
        timestamp: formatTimestamp(report.timestamp),

        aiAnalysis: report.aiAnalysis || {
          bertNlp: { confidence: 0, result: "Analysis pending" },
          resnet50: { confidence: 0, result: "No image analysis" },
          errorLevelAnalysis: { result: "Pending analysis" }
        },

        suspicionLevel: report.suspicionLevel || "unverified"
      }));

      setReports(transformed);

      const initial: any = {};
      transformed.forEach((r: any) => {
        initial[r.id] = "REAL";
      });
      setVerdicts(initial);

      transformed.forEach(async (r: any) => {
        try {
          const res = await axios.post(
            "http://localhost:5000/api/moderation/analyze",
            { description: r.description }
          );

          setVerdicts(prev => ({
            ...prev,
            [r.id]: res.data.verdict
          }));

        } catch {}
      });

    } catch {
      toast.error("Failed to load reports");
    }

    setLoading(false);
  };

  const openDialog = (id: string, action: "approve" | "reject") => {
    setSelectedReport(id);
    setActionType(action);
    setReason("");
  };

  const submitModeration = async () => {
    if (!selectedReport || !actionType) return;

    try {
      await reportsAPI.updateReportStatus(
        selectedReport,
        actionType === "approve" ? "approved" : "rejected",
        reason
      );

      toast.success("Report updated");

      setReports(prev => prev.filter(r => r.id !== selectedReport));
      setSelectedReport(null);

    } catch {
      toast.error("Failed to update report status");
    }
  };

  const getSuspicionColor = (level: string) => {
    switch (level) {
      case "unverified":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return <div className="p-10 text-center">Loading...</div>;
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50">

      <div className="container mx-auto px-4 py-6">

        <h2 className="mb-2">Moderation Dashboard</h2>

        <p className="text-sm text-gray-600 mb-6">
          Using: BERT NLP | ResNet50 | Error Level Analysis
        </p>

        {reports.map(report => (

          <Card key={report.id} className="p-6 mb-6">

            <div className="flex justify-between items-start mb-4">

              <div>
                <h3 className="mb-2">{report.title}</h3>

                <div className="flex gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3"/>
                    {report.location}
                  </span>

                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3"/>
                    {report.timestamp}
                  </span>
                </div>
              </div>

              <Badge className={getSuspicionColor(report.suspicionLevel)}>
                {report.suspicionLevel}
              </Badge>

            </div>

            <p className="text-sm mb-4">{report.description}</p>

            {/* ✅ AI CARDS (FIX APPLIED HERE ONLY) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

              {/* BERT (UNCHANGED) */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <div className="flex gap-2">
                  <Brain className="h-4 w-4 text-purple-600"/>
                  <div className="w-full">
                    <p className="text-xs mb-1">BERT NLP</p>
                    <p className="text-sm">
                      {report.aiAnalysis.bertNlp.result}
                    </p>

                    <div className="mt-2 bg-purple-200 h-2 rounded">
                      <div
                        className="bg-purple-600 h-2 rounded"
                        style={{
                          width: `${Number(report.aiAnalysis?.bertNlp?.confidence || 0)}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ✅ RESNET FIX */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <div className="flex gap-2 items-start">
                  <Camera className="h-4 w-4 mt-1"/>
                  <div>
                    <p className="text-xs mb-1">ResNet50</p>
                    <p className="text-sm">
                      {report.aiAnalysis.resnet50.result}
                    </p>
                  </div>
                </div>
              </div>

              {/* ✅ ERROR FIX */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="flex gap-2 items-start">
                  <AlertTriangle className="h-4 w-4 mt-1"/>
                  <div>
                    <p className="text-xs mb-1">Error Level Analysis</p>
                    <p className="text-sm">
                      {report.aiAnalysis.errorLevelAnalysis.result}
                    </p>
                  </div>
                </div>
              </div>

            </div>

            <div className="text-center font-bold text-lg mb-4">
              The news is {verdicts[report.id]}
            </div>

            <div className="flex gap-3">
              <Button
                variant="destructive"
                onClick={() => openDialog(report.id,"reject")}
              >
                <XCircle className="mr-2 h-4 w-4"/>
                Reject
              </Button>

              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => openDialog(report.id,"approve")}
              >
                <CheckCircle2 className="mr-2 h-4 w-4"/>
                Approve
              </Button>
            </div>

          </Card>

        ))}

      </div>

      <Dialog
        open={selectedReport !== null}
        onOpenChange={() => setSelectedReport(null)}
      >
        <DialogContent className="sm:max-w-[650px] p-8">

          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {actionType === "approve"
                ? "Approve Report"
                : "Reject Report"}
            </DialogTitle>
          </DialogHeader>

          <Textarea
            placeholder="Write moderation reason..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-4 min-h-[120px]"
          />

          <Button
            className={`w-full mt-4 py-5 text-white rounded-lg ${
              actionType === "approve"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            }`}
            onClick={submitModeration}
          >
            Submit Decision
          </Button>

        </DialogContent>
      </Dialog>

    </div>
  );
}