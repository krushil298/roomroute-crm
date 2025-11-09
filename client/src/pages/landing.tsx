import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, Calendar, Mail } from "lucide-react";
import logoUrl from "@assets/image_1762307821152.png";

export default function Landing() {
  const handleSignup = () => {
    window.location.href = "/signup";
  };

  const handleLogin = () => {
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="flex justify-center mb-6">
              <img
                src={logoUrl}
                alt="RoomRoute Logo"
                className="h-32 w-auto"
                data-testid="img-logo"
              />
            </div>
            <h1 className="text-5xl font-bold mb-2" data-testid="text-title">
              RoomRoute
            </h1>
            <p className="text-lg text-muted-foreground mb-8 italic" data-testid="text-tagline">
              Your Route to Room Nights
            </p>
            <p className="text-xl text-muted-foreground mb-8" data-testid="text-subtitle">
              Hotel CRM built for the hospitality industry
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                size="lg"
                onClick={handleSignup}
                data-testid="button-signup"
              >
                Get Started
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={handleLogin}
                data-testid="button-login"
              >
                Log In
              </Button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <Card data-testid="card-feature-contacts">
              <CardHeader>
                <Users className="h-8 w-8 mb-2 text-primary" />
                <CardTitle className="text-lg">Contact Management</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Keep track of all your leads and customer contacts in one place
                </CardDescription>
              </CardContent>
            </Card>

            <Card data-testid="card-feature-deals">
              <CardHeader>
                <TrendingUp className="h-8 w-8 mb-2 text-primary" />
                <CardTitle className="text-lg">Deal Pipeline</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Track deals through every stage from lead to closed
                </CardDescription>
              </CardContent>
            </Card>

            <Card data-testid="card-feature-activity">
              <CardHeader>
                <Calendar className="h-8 w-8 mb-2 text-primary" />
                <CardTitle className="text-lg">Activity Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Log calls, emails, and meetings with your contacts
                </CardDescription>
              </CardContent>
            </Card>

            <Card data-testid="card-feature-email">
              <CardHeader>
                <Mail className="h-8 w-8 mb-2 text-primary" />
                <CardTitle className="text-lg">Email Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Send professional emails with customizable templates
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          {/* How It Works */}
          <div className="bg-card rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-6 text-center">Built for Hotels</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <div className="text-4xl font-bold text-primary mb-2">1</div>
                <h3 className="font-semibold mb-2">Create Your Organization</h3>
                <p className="text-muted-foreground text-sm">
                  Set up your hotel or property management company
                </p>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary mb-2">2</div>
                <h3 className="font-semibold mb-2">Import Your Contacts</h3>
                <p className="text-muted-foreground text-sm">
                  Upload your leads via CSV or add them manually
                </p>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary mb-2">3</div>
                <h3 className="font-semibold mb-2">Close More Deals</h3>
                <p className="text-muted-foreground text-sm">
                  Track your pipeline and never miss a follow-up
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
