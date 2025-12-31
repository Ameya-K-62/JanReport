import { Button } from "./ui/button";
import { Menu, Bell, User, Shield, LogOut } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { Badge } from "./ui/badge";

interface HeaderProps {
  onNavigate: (view: string) => void;
  currentView: string;
  onSubmitClick: () => void;
  userType: "user" | "moderator" | null;
  onLoginClick: () => void;
  onLogout: () => void;
}

export function Header({ onNavigate, currentView, onSubmitClick, userType, onLoginClick, onLogout }: HeaderProps) {
  const headerBg = userType === "moderator" 
    ? "bg-gradient-to-r from-purple-600 to-purple-700" 
    : "bg-gradient-to-r from-red-600 to-red-700";

  return (
    <header className={`sticky top-0 z-50 w-full ${headerBg} text-white shadow-lg`}>
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur">
              <span className="text-xl">{userType === "moderator" ? "🛡️" : "📰"}</span>
            </div>
            <div>
              <h1 className="text-2xl tracking-tight">JanReport</h1>
              {userType === "moderator" && (
                <Badge variant="outline" className="text-xs border-white/50 text-white">
                  Moderator
                </Badge>
              )}
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {userType === "moderator" ? (
              <Button
                variant={currentView === "moderation" ? "secondary" : "ghost"}
                onClick={() => onNavigate("moderation")}
                className={currentView === "moderation" ? "" : "text-white hover:bg-white/20"}
              >
                <Shield className="mr-2 h-4 w-4" />
                Moderation Dashboard
              </Button>
            ) : (
              <>
                <Button
                  variant={currentView === "feed" ? "secondary" : "ghost"}
                  onClick={() => onNavigate("feed")}
                  className={currentView === "feed" ? "" : "text-white hover:bg-white/20"}
                >
                  News Feed
                </Button>
                <Button
                  variant={currentView === "map" ? "secondary" : "ghost"}
                  onClick={() => onNavigate("map")}
                  className={currentView === "map" ? "" : "text-white hover:bg-white/20"}
                >
                  Map View
                </Button>
                {userType === "user" && (
                  <Button
                    variant="ghost"
                    onClick={onSubmitClick}
                    className="text-white hover:bg-white/20"
                  >
                    Submit Report
                  </Button>
                )}
              </>
            )}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2">
            {userType && (
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                <Bell className="h-5 w-5" />
              </Button>
            )}
            {userType ? (
              <Button 
                variant="outline" 
                className="bg-white/10 text-white border-white/30 hover:bg-white/20"
                onClick={onLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            ) : (
              <Button 
                variant="outline" 
                className="bg-white text-red-600 hover:bg-white/90"
                onClick={onLoginClick}
              >
                <User className="mr-2 h-4 w-4" />
                Login
              </Button>
            )}
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <nav className="flex flex-col gap-4 mt-8">
                  {userType === "moderator" ? (
                    <Button
                      variant={currentView === "moderation" ? "default" : "ghost"}
                      onClick={() => onNavigate("moderation")}
                      className="w-full justify-start"
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      Moderation Dashboard
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant={currentView === "feed" ? "default" : "ghost"}
                        onClick={() => onNavigate("feed")}
                        className="w-full justify-start"
                      >
                        News Feed
                      </Button>
                      <Button
                        variant={currentView === "map" ? "default" : "ghost"}
                        onClick={() => onNavigate("map")}
                        className="w-full justify-start"
                      >
                        Map View
                      </Button>
                      {userType === "user" && (
                        <Button
                          variant="ghost"
                          onClick={onSubmitClick}
                          className="w-full justify-start"
                        >
                          Submit Report
                        </Button>
                      )}
                    </>
                  )}
                  {userType ? (
                    <Button 
                      variant="outline" 
                      className="w-full justify-start mt-4"
                      onClick={onLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      className="w-full justify-start mt-4"
                      onClick={onLoginClick}
                    >
                      <User className="mr-2 h-4 w-4" />
                      Login
                    </Button>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
