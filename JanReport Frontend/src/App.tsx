import { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { NewsCard } from "./components/NewsCard";
import { NewsPost } from "./components/NewsPost";
import { MapView } from "./components/MapView";
import { MobileBottomNav } from "./components/MobileBottomNav";
import { SubmitReportDialog } from "./components/SubmitReportDialog";
import { LoginDialog } from "./components/LoginDialog";
import { ModerationDashboard } from "./components/ModerationDashboard";
import { AnalyticsDashboard } from "./components/AnalyticsDashboard";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import type { NewsReport } from "./components/NewsCard";
import { authAPI, reportsAPI } from "./services/api";

// ✅ AI PANEL
import { AIInsightsPanel } from "./components/AIInsightsPanel";

export default function App() {
  const [currentView, setCurrentView] = useState<string>("feed");
  const [mobileTab, setMobileTab] = useState<string>("feed");
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [userType, setUserType] = useState<"user" | "moderator" | null>(null);
  const [reports, setReports] = useState<NewsReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  // ✅ AI STATE
  const [selectedReport, setSelectedReport] = useState<NewsReport | null>(null);

  useEffect(() => {
    const currentUser = authAPI.getCurrentUser();
    if (currentUser) {
      setUserType(currentUser.userType);
      if (currentUser.userType === "moderator") {
        setCurrentView("moderation");
        setMobileTab("moderation");
      }
    }
  }, []);

  useEffect(() => {
    if (
      currentView === "feed" ||
      mobileTab === "feed" ||
      currentView === "map" ||
      mobileTab === "map" ||
      currentView === "my-reports"
    ) {
      fetchReports();
    }
  }, [currentView, mobileTab]);

  const fetchReports = async (viewOverride?: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const effectiveView = viewOverride ?? currentView;

      if (effectiveView === "my-reports") {
        const response = await reportsAPI.getMyReports();
        setReports(response.data.reports);
      } else {
        const response = await reportsAPI.getReports(1, 20);
        setReports(response.data.reports);
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        setReports([]);
      } else {
        setError(err.message || "Failed to load reports");
        toast.error("Failed to load reports");
      }
      console.error("Fetch reports error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (view: string) => {
    setCurrentView(view);
    setMobileTab(view);
  };

  const handleReportClick = (reportId: string) => {
    setSelectedReportId(reportId);
    handleNavigate("map");
  };

  const handleLogin = (type: "user" | "moderator") => {
    setUserType(type);
    if (type === "moderator") {
      setCurrentView("moderation");
      setMobileTab("moderation");
    } else {
      setCurrentView("feed");
      setMobileTab("feed");
      fetchReports();
    }
  };

  const handleLogout = () => {
    authAPI.logout();
    setUserType(null);
    setCurrentView("feed");
    setMobileTab("feed");
    toast.success("Logged out successfully");

    setReports([]);
    setError(null);
    setLoading(false);
  };

  const handleReportSubmit = async () => {
    setCurrentView("my-reports");
    setMobileTab("my-reports");
    await fetchReports("my-reports");
  };

  const handleDeleteMyReport = async (reportId: string) => {
    try {
      await reportsAPI.deleteReport(reportId);
      setReports((prev) => prev.filter((r) => r.id !== reportId));
      toast.success("Report deleted successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete report");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        onNavigate={handleNavigate}
        currentView={currentView}
        onSubmitClick={() => setSubmitDialogOpen(true)}
        userType={userType}
        onLoginClick={() => setLoginDialogOpen(true)}
        onLogout={handleLogout}
      />

      <main className={`pb-20 md:pb-8 ${userType !== "moderator" ? "pb-safe-nav" : "pb-10"}`}>
        {currentView === "moderation" && userType === "moderator" ? (
          <ModerationDashboard />
        ) : currentView === "analytics" || mobileTab === "analytics" ? (
          <AnalyticsDashboard userType={userType} />
        ) : currentView === "alerts" || mobileTab === "alerts" ? (
          <div className="container mx-auto px-4 py-6">
            <h2 className="mb-6">Notifications</h2>
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
              No new alerts
            </div>
          </div>
        ) : currentView === "profile" || mobileTab === "profile" ? (
          <div className="container mx-auto px-4 py-6">
            <h2 className="mb-6">Profile</h2>
            {userType ? (
              <div className="bg-white p-6 shadow rounded">
                Logged in as <b>{userType}</b>
              </div>
            ) : (
              <button onClick={() => setLoginDialogOpen(true)}>Login</button>
            )}
          </div>
        ) : currentView === "map" || mobileTab === "map" ? (
          <MapView
            reports={reports}
            selectedReportIdProp={selectedReportId}
            onClearSelection={() => setSelectedReportId(null)}
          />
        ) : (
          <div className="container mx-auto px-4 py-6">
            {loading ? (
              <p className="text-center">Loading...</p>
            ) : error ? (
              <div className="text-center">
                <p className="text-red-500">{error}</p>
                {/* ✅ FIXED BUTTON */}
                <button
                  onClick={() => fetchReports()}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded"
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reports.map((report) => (
                  <NewsCard
                    key={report.id}
                    report={report}
                    onClick={() => handleReportClick(report.id)}
                    onDelete={currentView === "my-reports" ? handleDeleteMyReport : undefined}
                    onAIInsights={(r) => setSelectedReport(r)} // ✅ AI
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ✅ AI PANEL */}
      {selectedReport && (
        <AIInsightsPanel
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
        />
      )}

      {userType !== "moderator" && (
        <MobileBottomNav
          currentView={mobileTab}
          onNavigate={handleNavigate}
          onSubmitClick={() => setSubmitDialogOpen(true)}
          userType={userType}
        />
      )}

      <LoginDialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen} onLogin={handleLogin} />
      <SubmitReportDialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen} onSubmit={handleReportSubmit} />
      <Toaster />
    </div>
  );
}