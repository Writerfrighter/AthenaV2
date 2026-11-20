"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ModeToggle } from "@/components/ui/light-dark-toggle";
import { ThemeSelector } from "@/components/settings/theme-selector";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { APP_DESCRIPTION, APP_LOGO, APP_NAME } from "@/lib/app-config";

interface LoginFormData {
  username: string;
  password: string;
}

export default function Page() {
  const [formData, setFormData] = useState<LoginFormData>({
    username: "",
    password: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (field: keyof LoginFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await signIn("credentials", {
        username: formData.username,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        console.error("Login error:", result.error);
        toast.error("Login failed", {
          description: "Invalid username or password",
        });
      } else if (result?.ok) {
        toast.success("Login successful!", {
          description: `Welcome back to ${APP_NAME}!`,
        });
        // Use hard redirect to ensure session cookie is properly sent
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- Reload the session provider after credentials sign-in.
        window.location.href = "/dashboard";
      } else {
        console.error("Unexpected login result:", result);
        toast.error("Login failed", {
          description: "An unexpected error occurred",
        });
      }
    } catch (error) {
      console.error("Login exception:", error);
      toast.error("Login failed", {
        description: "An unexpected error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div aria-hidden="true" className="flex h-[3px]">
        <div className="flex-1 bg-[#E5484D]" />
        <div className="flex-1 bg-[#3B7BF6]" />
      </div>
      <div className="flex flex-1 flex-wrap">
        <section className="flex flex-[1_1_420px] flex-col justify-between gap-10 p-8 md:p-14">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="text-xl font-bold tracking-tight lowercase">
              {APP_NAME}<span className="text-chart-1">.</span>
            </Link>
            <div className="flex gap-2">
              <ModeToggle />
              <ThemeSelector />
            </div>
          </div>
          <div className="flex max-w-[420px] flex-col gap-4">
            <h1 className="text-[44px] font-bold leading-[0.95] tracking-[-0.04em]">
              Log in to {APP_NAME}
            </h1>
            <p className="leading-relaxed text-muted-foreground">
              Sign in with your team account to scout, plan and review the event.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="flex max-w-[380px] flex-col gap-3.5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={formData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                className="h-12 text-[15px]"
                autoComplete="username"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className="h-12 pr-12 text-[15px]"
                  autoComplete="current-password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-1 right-1"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </Button>
              </div>
            </div>
            <Button type="submit" className="mt-1 h-12 w-full text-[15px] font-semibold" disabled={isSubmitting}>
              {isSubmitting ? "Logging in…" : "Log In"}
            </Button>
            <div className="flex justify-between gap-4 text-[13px]">
              <Link href="/signup" className="text-muted-foreground hover:text-foreground">
                Create an account
              </Link>
              <Link href="/" className="text-muted-foreground hover:text-foreground">
                Back to home
              </Link>
            </div>
          </form>
          <span className="font-mono text-xs text-muted-foreground">{APP_DESCRIPTION}</span>
        </section>
        <section aria-hidden="true" className="relative m-4 hidden min-h-[600px] flex-[1.2_1_480px] items-center justify-center overflow-hidden rounded-[20px] bg-[#ECECEA] md:flex dark:bg-muted">
          <Image src={APP_LOGO} alt="" width={112} height={112} unoptimized className="size-28 opacity-90" />
        </section>
      </div>
    </div>
  );
}
