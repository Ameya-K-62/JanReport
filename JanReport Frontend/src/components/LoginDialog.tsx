import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { User, Shield } from "lucide-react";
import { toast } from "sonner";
import { authAPI } from "../services/api";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogin: (userType: "user" | "moderator", userData?: any) => void;
}

export function LoginDialog({ open, onOpenChange, onLogin }: LoginDialogProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState<"user" | "moderator">("user");
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setEmail("");
      setPassword("");
      setIsSignup(false);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      let data;
      if (isSignup) {
        // Signup
        data = await authAPI.signup(email, password, activeTab);
      } else {
        // Login
        data = await authAPI.login(email, password, activeTab);
      }

      // Get user type from response
      const userType = data.data?.user?.userType;
      if (!userType || (userType !== "user" && userType !== "moderator")) {
        throw new Error("Invalid user role returned from server");
      }

      toast.success(
        isSignup
          ? `Account created successfully! Logged in as ${userType === "moderator" ? "Moderator" : "User"}`
          : `Logged in as ${userType === "moderator" ? "Moderator" : "User"}`
      );
      
      // Call onLogin callback with user data
      onLogin(userType, data.data?.user);
      
      // Reset form
      setEmail("");
      setPassword("");
      setIsSignup(false);
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || `${isSignup ? "Signup" : "Login"} failed`);
      console.error("Auth error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isSignup ? "Sign up" : "Login"} to JanReport</DialogTitle>
          <DialogDescription>
            {isSignup 
              ? "Create a new account to submit and view local news reports"
              : "Choose your login type and enter your credentials"}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "user" | "moderator")} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="user" className="gap-2">
              <User className="h-4 w-4" />
              User
            </TabsTrigger>
            <TabsTrigger value="moderator" className="gap-2">
              <Shield className="h-4 w-4" />
              Moderator
            </TabsTrigger>
          </TabsList>

          <TabsContent value="user" className="mt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="user-email">Email</Label>
                <Input
                  id="user-email"
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="user-password">Password</Label>
                <Input
                  id="user-password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  minLength={6}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                {isSignup 
                  ? "Sign up as a user to submit and view local news reports"
                  : "Login as a user to submit and view local news reports"}
              </div>

              <Button 
                type="submit" 
                className="w-full bg-red-600 hover:bg-red-700"
                disabled={loading}
              >
                {loading ? "Please wait..." : isSignup ? "Sign up as User" : "Login as User"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="moderator" className="mt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mod-email">Email</Label>
                <Input
                  id="mod-email"
                  type="email"
                  placeholder="moderator@janreport.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mod-password">Password</Label>
                <Input
                  id="mod-password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  minLength={6}
                />
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm text-purple-800">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="h-4 w-4" />
                  <span>Moderator Access</span>
                </div>
                {isSignup
                  ? "Sign up as a moderator to access the AI-powered moderation dashboard"
                  : "Access the AI-powered moderation dashboard to review and verify community reports"}
              </div>

              <Button 
                type="submit" 
                className="w-full bg-purple-600 hover:bg-purple-700"
                disabled={loading}
              >
                {loading ? "Please wait..." : isSignup ? "Sign up as Moderator" : "Login as Moderator"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="text-center text-sm text-gray-500 mt-4">
          {isSignup ? (
            <>
              Already have an account?{" "}
              <a
                href="#"
                className="text-red-600 hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  setIsSignup(false);
                  setEmail("");
                  setPassword("");
                }}
              >
                Login
              </a>
            </>
          ) : (
            <>
              Don't have an account?{" "}
              <a
                href="#"
                className="text-red-600 hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  setIsSignup(true);
                  setEmail("");
                  setPassword("");
                }}
              >
                Sign up
              </a>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
