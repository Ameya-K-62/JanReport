import { useState } from "react";
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
import { toast } from "sonner@2.0.3";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogin: (userType: "user" | "moderator") => void;
}

export function LoginDialog({ open, onOpenChange, onLogin }: LoginDialogProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState<"user" | "moderator">("user");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    // Mock login
    toast.success(`Logged in as ${activeTab === "moderator" ? "Moderator" : "User"}`);
    onLogin(activeTab);
    
    // Reset form
    setEmail("");
    setPassword("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Login to JanReport</DialogTitle>
          <DialogDescription>
            Choose your login type and enter your credentials
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
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                Login as a user to submit and view local news reports
              </div>

              <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">
                Login as User
              </Button>

              <div className="text-center text-sm text-gray-500">
                Don't have an account? <a href="#" className="text-red-600 hover:underline">Sign up</a>
              </div>
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
                />
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm text-purple-800">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="h-4 w-4" />
                  <span>Moderator Access</span>
                </div>
                Access the AI-powered moderation dashboard to review and verify community reports
              </div>

              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">
                Login as Moderator
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
