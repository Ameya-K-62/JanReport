import { Home, Map, PlusCircle, Bell, User, BarChart3 } from "lucide-react";
import { Button } from "./ui/button";

interface MobileBottomNavProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onSubmitClick: () => void;
  userType: "user" | "moderator" | null;
}

export function MobileBottomNav({ currentView, onNavigate, onSubmitClick, userType }: MobileBottomNavProps) {
  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50 pb-safe-area"
    >
      <div className="flex items-center justify-around h-16">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate("feed")}
          className={`flex flex-col items-center gap-1 h-full rounded-none ${
            currentView === "feed" ? "text-red-600" : "text-gray-600"
          }`}
        >
          <Home className="h-5 w-5" />
          <span className="text-xs">Feed</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate("map")}
          className={`flex flex-col items-center gap-1 h-full rounded-none ${
            currentView === "map" ? "text-red-600" : "text-gray-600"
          }`}
        >
          <Map className="h-5 w-5" />
          <span className="text-xs">Map</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onSubmitClick}
          className="flex flex-col items-center gap-1 h-full rounded-none text-red-600"
        >
          <div className="h-10 w-10 bg-red-600 rounded-full flex items-center justify-center -mt-5 shadow-lg">
            <PlusCircle className="h-6 w-6 text-white" />
          </div>
          <span className="text-xs mt-1">Report</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate("alerts")}
          className={`flex flex-col items-center gap-1 h-full rounded-none ${
            currentView === "alerts" ? "text-red-600" : "text-gray-600"
          }`}
        >
          <Bell className="h-5 w-5" />
          <span className="text-xs">Alerts</span>
        </Button>

        {userType && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate("analytics")}
            className={`flex flex-col items-center gap-1 h-full rounded-none ${
              currentView === "analytics" ? "text-red-600" : "text-gray-600"
            }`}
          >
            <BarChart3 className="h-5 w-5" />
            <span className="text-xs">Analytics</span>
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate("profile")}
          className={`flex flex-col items-center gap-1 h-full rounded-none ${
            currentView === "profile" ? "text-red-600" : "text-gray-600"
          }`}
        >
          <User className="h-5 w-5" />
          <span className="text-xs">Profile</span>
        </Button>
      </div>
    </div>
  );
}
