import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import logoUrl from "@assets/image_1762307821152.png";
import hotelImage from "@assets/hotel-building.jpg.png";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Login failed");
      }

      toast({
        title: "Welcome back!",
        description: "Successfully logged in",
      });

      // Redirect to dashboard
      window.location.href = "/";
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#0f2942]">
        <div className="w-full max-w-md space-y-8">
          {/* Logo and Branding */}
          <div className="space-y-6">
            <img
              src={logoUrl}
              alt="RoomRoute Logo"
              className="h-16 w-auto"
            />
            <div>
              <h1 className="text-5xl font-bold text-white mb-2">RoomRoute</h1>
              <p className="text-lg text-gray-300">Your Route to Room Nights</p>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-12">
            <div className="space-y-2">
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="Email address"
                disabled={isLoading}
                autoComplete="email"
                className="bg-[#1a3a52] border-[#2d5270] text-white placeholder:text-gray-400 h-14 text-base"
              />
              {errors.email && (
                <p className="text-sm text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Input
                id="password"
                type="password"
                {...register("password")}
                placeholder="Password"
                disabled={isLoading}
                autoComplete="current-password"
                className="bg-[#1a3a52] border-[#2d5270] text-white placeholder:text-gray-400 h-14 text-base"
              />
              {errors.password && (
                <p className="text-sm text-red-400">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-[#2d5270] bg-[#1a3a52]" />
                <span className="text-sm text-gray-300">Remember me</span>
              </label>
              <a
                href="/forgot-password"
                className="text-sm text-gray-300 hover:text-white transition-colors"
              >
                Forgot password?
              </a>
            </div>

            <Button
              type="submit"
              className="w-full h-14 text-base font-semibold bg-[#f5a623] hover:bg-[#e09612] text-white"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Log in"}
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#2d5270]"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-[#0f2942] px-3 text-gray-400">
                  Or continue with
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full h-14 text-base bg-transparent border-[#2d5270] text-white hover:bg-[#1a3a52] hover:text-white"
              onClick={() => window.location.href = "/api/auth/google"}
              disabled={isLoading}
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </Button>

            <div className="text-center text-sm text-gray-400 pt-4">
              Don't have an account?{" "}
              <a href="/signup" className="text-[#f5a623] hover:text-[#e09612] font-medium transition-colors">
                Sign up
              </a>
            </div>
          </form>
        </div>
      </div>

      {/* Right Side - Building Image */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <img
          src={hotelImage}
          alt="Modern Hotel Building"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[#0f2942]/20"></div>
      </div>
    </div>
  );
}
