'use client'

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ModeToggle } from "@/components/ui/light-dark-toggle"
import { ArrowLeft, Users, UserPlus } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface SignupFormData {
  name: string
  username: string
  password: string
  confirmPassword: string
}

export default function Page() {
  const [formData, setFormData] = useState<SignupFormData>({
    name: '',
    username: '',
    password: '',
    confirmPassword: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (field: keyof SignupFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords don't match")
      return
    }

    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters long")
      return
    }

    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          username: formData.username,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Account created successfully!", {
          description: "Welcome to TRC Athena Scouting! Please sign in."
        })
        // Redirect to login page
        window.location.href = '/login'
      } else {
        toast.error("Registration failed", {
          description: data.error || "An error occurred during registration"
        })
      }
    } catch (error) {
      toast.error("Registration failed", {
        description: "Network error. Please try again."
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background dark:bg-background">
      <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10">
        <div className="fixed top-4 left-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
        
        <div className="fixed top-4 right-4">
          <ModeToggle />
        </div>
        
        <div className="w-full max-w-md">
          <Card className="shadow-lg border border-primary/10 rounded-2xl bg-white/80 dark:bg-background/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-primary/10 dark:bg-primary/20 rounded-full w-12 h-12 flex items-center justify-center shadow-sm">
                <UserPlus className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl font-semibold text-primary/90">Create Account</CardTitle>
              <CardDescription className="text-muted-foreground/80">
                Join the TRC Athena Scouting platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Personal Information */}
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      required
                      className="focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    placeholder="johndoe492"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    required
                    className="focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    required
                    className="focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    required
                    className="focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Users className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Create Account
                    </>
                  )}
                </Button>

                {/* OAuth Options */}
                {/* <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-green-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>

                <Button variant="outline" type="button" className="w-full border-green-200 hover:bg-green-50">
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Sign up with Google
                </Button> */}
              </form>

              <div className="mt-6 text-center text-sm">
                Already have an account?{" "}
                <Link href="/login" className="underline underline-offset-4 hover:text-primary">
                  Sign in
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
