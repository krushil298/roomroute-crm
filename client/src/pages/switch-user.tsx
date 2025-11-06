import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, LogIn, Users } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SwitchUser() {
  const [, setLocation] = useLocation();
  const [lastUser, setLastUser] = useState<{ email: string; name: string } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("lastLoggedInUser");
    if (stored) {
      try {
        setLastUser(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse last user:", e);
      }
    }
  }, []);

  const handleSameUser = () => {
    setLocation("/login");
  };

  const handleDifferentUser = () => {
    // Clear last user info
    localStorage.removeItem("lastLoggedInUser");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Who's Logging In?</CardTitle>
          <CardDescription>
            {lastUser ? (
              <>Last user: {lastUser.name} ({lastUser.email})</>
            ) : (
              "Confirm your identity to continue"
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {lastUser && (
            <Button
              className="w-full"
              size="lg"
              onClick={handleSameUser}
              data-testid="button-same-user"
            >
              <LogIn className="mr-2 h-5 w-5" />
              Yes, I'm {lastUser.name}
            </Button>
          )}

          <div className="space-y-3">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Different user?
                </span>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                To log in as a different user on this computer, please:
                <ul className="list-disc ml-5 mt-2 space-y-1">
                  <li>Use Private/Incognito browsing mode, or</li>
                  <li>Clear your browser's cookies and history</li>
                </ul>
              </AlertDescription>
            </Alert>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleDifferentUser}
              data-testid="button-different-user"
            >
              I understand - Clear last user info
            </Button>
          </div>

          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              data-testid="button-back-home"
            >
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
