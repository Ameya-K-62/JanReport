import { useState } from "react";
import { Header } from "./components/Header";
import { NewsCard } from "./components/NewsCard";
import { NewsPost } from "./components/NewsPost";
import { MapView } from "./components/MapView";
import { MobileBottomNav } from "./components/MobileBottomNav";
import { SubmitReportDialog } from "./components/SubmitReportDialog";
import { LoginDialog } from "./components/LoginDialog";
import { ModerationDashboard } from "./components/ModerationDashboard";
import { Tabs, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner@2.0.3";
import type { NewsReport } from "./components/NewsCard";

// Mock data for news reports
const mockReports: NewsReport[] = [
  {
    id: "1",
    title: "Major Traffic Jam on MG Road Due to Water Pipeline Burst",
    description: "Heavy traffic congestion reported on MG Road following a water pipeline burst. Authorities are working to fix the issue. Commuters are advised to take alternate routes.",
    location: "MG Road, Bangalore",
    image: "https://images.unsplash.com/photo-1608547941697-db7af3f26dd1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsb2NhbCUyMHN0cmVldCUyMHRyYWZmaWN8ZW58MXx8fHwxNzYxODQ0NTQ5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    author: "rajesh_kumar",
    timestamp: "2 hours ago",
    views: 1243,
    likes: 89,
    comments: 23,
    status: "approved",
    category: "Traffic"
  },
  {
    id: "2",
    title: "Local Residents Protest Against Illegal Construction in Residential Area",
    description: "Residents of Koramangala staged a peaceful protest against unauthorized construction that violates local zoning laws and environmental regulations.",
    location: "Koramangala, Bangalore",
    image: "https://images.unsplash.com/photo-1697183381204-4104ce8d44ec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm90ZXN0JTIwcmFsbHl8ZW58MXx8fHwxNzYxODQ0NTQ5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    author: "priya_sharma",
    timestamp: "5 hours ago",
    views: 2156,
    likes: 234,
    comments: 67,
    status: "approved",
    category: "Community Event"
  },
  {
    id: "3",
    title: "New Metro Station Construction Begins in Whitefield",
    description: "The construction of a new metro station has commenced in Whitefield, expected to improve connectivity and reduce traffic congestion in the IT corridor.",
    location: "Whitefield, Bangalore",
    image: "https://images.unsplash.com/photo-1722685652461-df410191410f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1cmJhbiUyMGRldmVsb3BtZW50JTIwY29uc3RydWN0aW9ufGVufDF8fHx8MTc2MTgwNzIxOHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    author: "metro_updates",
    timestamp: "1 day ago",
    views: 3421,
    likes: 456,
    comments: 89,
    status: "approved",
    category: "Infrastructure"
  },
  {
    id: "4",
    title: "Severe Water Shortage Affects Hundreds of Households in HSR Layout",
    description: "Residents of HSR Layout are facing acute water shortage for the past three days. Local water board has promised to resolve the issue within 24 hours.",
    location: "HSR Layout, Bangalore",
    image: "https://images.unsplash.com/photo-1630879514309-378dc2f9e866?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3YXRlciUyMHNob3J0YWdlJTIwY3Jpc2lzfGVufDF8fHx8MTc2MTg0NDU0OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    author: "local_reporter",
    timestamp: "3 hours ago",
    views: 1876,
    likes: 134,
    comments: 45,
    status: "approved",
    category: "Public Safety"
  },
  {
    id: "5",
    title: "Air Quality Deteriorates as Pollution Levels Rise in City Center",
    description: "Air quality index reaches unhealthy levels in the city center. Health officials advise residents to avoid outdoor activities and wear masks when going out.",
    location: "City Center, Bangalore",
    image: "https://images.unsplash.com/photo-1532300481631-0bc14f3b7699?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaXR5JTIwcG9sbHV0aW9ufGVufDF8fHx8MTc2MTcyMzA5MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    author: "enviro_watch",
    timestamp: "6 hours ago",
    views: 2987,
    likes: 267,
    comments: 78,
    status: "approved",
    category: "Environment"
  },
  {
    id: "6",
    title: "Community Clean-Up Drive Successfully Removes 2 Tons of Waste from Lake",
    description: "Over 200 volunteers participated in a weekend clean-up drive at Bellandur Lake, removing approximately 2 tons of plastic waste and debris from the water body.",
    location: "Bellandur Lake, Bangalore",
    image: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tdW5pdHklMjBtZWV0aW5nfGVufDF8fHx8MTc2MTgzMDU5OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    author: "green_warriors",
    timestamp: "8 hours ago",
    views: 1654,
    likes: 398,
    comments: 56,
    status: "approved",
    category: "Community Event"
  },
  {
    id: "7",
    title: "Road Accident Claims One Life on Outer Ring Road",
    description: "A fatal accident on the Outer Ring Road near Marathahalli claimed one life early this morning. Traffic police are investigating the cause.",
    location: "Outer Ring Road, Bangalore",
    image: "https://images.unsplash.com/photo-1608547941697-db7af3f26dd1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsb2NhbCUyMHN0cmVldCUyMHRyYWZmaWN8ZW58MXx8fHwxNzYxODQ0NTQ5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    author: "traffic_updates",
    timestamp: "4 hours ago",
    views: 2341,
    likes: 67,
    comments: 34,
    status: "approved",
    category: "Breaking News"
  },
  {
    id: "8",
    title: "New Park Inaugurated in Indiranagar for Children and Families",
    description: "A new 2-acre park with modern play equipment and walking tracks was inaugurated in Indiranagar, providing a much-needed recreational space for families.",
    location: "Indiranagar, Bangalore",
    image: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tdW5pdHklMjBtZWV0aW5nfGVufDF8fHx8MTc2MTgzMDU5OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    author: "civic_news",
    timestamp: "12 hours ago",
    views: 987,
    likes: 156,
    comments: 28,
    status: "approved",
    category: "Infrastructure"
  }
];

export default function App() {
  const [currentView, setCurrentView] = useState<string>("feed");
  const [mobileTab, setMobileTab] = useState<string>("feed");
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [userType, setUserType] = useState<"user" | "moderator" | null>(null);

  const handleNavigate = (view: string) => {
    setCurrentView(view);
    setMobileTab(view);
  };

  const handleLogin = (type: "user" | "moderator") => {
    setUserType(type);
    if (type === "moderator") {
      setCurrentView("moderation");
      setMobileTab("moderation");
    } else {
      setCurrentView("feed");
      setMobileTab("feed");
    }
  };

  const handleLogout = () => {
    setUserType(null);
    setCurrentView("feed");
    setMobileTab("feed");
    toast.success("Logged out successfully");
  };

  const handleReportSubmit = (reportData: any) => {
    // In a real app, this would submit to backend
    console.log("Report submitted:", reportData);
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

      {/* Mobile Tabs - Only visible on mobile and not for moderators */}
      {userType !== "moderator" && (
        <div className="md:hidden sticky top-16 z-40 bg-white border-b">
          <Tabs value={mobileTab} onValueChange={setMobileTab} className="w-full">
            <TabsList className="w-full rounded-none h-12 bg-white border-b">
              <TabsTrigger value="feed" className="flex-1">News Feed</TabsTrigger>
              <TabsTrigger value="map" className="flex-1">Map View</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}

      {/* Main Content */}
      <main className="pb-20 md:pb-8">
        {currentView === "moderation" && userType === "moderator" ? (
          <ModerationDashboard />
        ) : (
          <>
            {(currentView === "feed" || mobileTab === "feed") && currentView !== "map" && (
              <div className="container mx-auto px-4 py-6">
                {/* Desktop Grid Layout */}
                <div className="hidden md:block">
                  <h2 className="mb-6">Latest Community Reports</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {mockReports.map((report) => (
                      <NewsCard key={report.id} report={report} />
                    ))}
                  </div>
                </div>

                {/* Mobile Feed Layout */}
                <div className="md:hidden max-w-2xl mx-auto">
                  {mockReports.map((report) => (
                    <NewsPost key={report.id} report={report} />
                  ))}
                </div>
              </div>
            )}

            {(currentView === "map" || mobileTab === "map") && (
              <MapView reports={mockReports} />
            )}
          </>
        )}
      </main>

      {/* Mobile Bottom Navigation - Only show for non-moderators */}
      {userType !== "moderator" && (
        <MobileBottomNav
          currentView={mobileTab}
          onNavigate={handleNavigate}
          onSubmitClick={() => {
            if (!userType) {
              toast.error("Please login to submit a report");
              setLoginDialogOpen(true);
            } else {
              setSubmitDialogOpen(true);
            }
          }}
        />
      )}

      {/* Login Dialog */}
      <LoginDialog
        open={loginDialogOpen}
        onOpenChange={setLoginDialogOpen}
        onLogin={handleLogin}
      />

      {/* Submit Report Dialog */}
      <SubmitReportDialog
        open={submitDialogOpen}
        onOpenChange={setSubmitDialogOpen}
        onSubmit={handleReportSubmit}
      />

      {/* Toast notifications */}
      <Toaster position="top-center" />
    </div>
  );
}
