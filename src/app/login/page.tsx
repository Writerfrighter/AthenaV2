'use client'

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
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
import { ModeToggle } from "@/components/ui/light-dark-toggle"
import { ArrowLeft, Users, UserRound } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface LoginFormData {
  username: string
  password: string
}

export default function Page() {
  const router = useRouter()
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (field: keyof LoginFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      console.log('Attempting login with username:', formData.username)
      const result = await signIn("credentials", {
        username: formData.username,
        password: formData.password,
        redirect: false,
      })

      console.log('SignIn result:', result)

      if (result?.error) {
        console.error('Login error:', result.error)
        toast.error("Login failed", {
          description: "Invalid email or password"
        })
      } else if (result?.ok) {
        toast.success("Login successful!", {
          description: "Welcome back to TRC Athena Scouting!"
        })
        // Give the session a moment to be established
        setTimeout(() => {
          router.push("/dashboard")
        }, 750)
      } else {
        console.error('Unexpected login result:', result)
        toast.error("Login failed", {
          description: "An unexpected error occurred"
        })
      }
    } catch (error) {
      console.error('Login exception:', error)
      toast.error("Login failed", {
        description: "An unexpected error occurred"
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
                <UserRound className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl font-semibold text-primary/90">Sign In</CardTitle>
              <CardDescription className="text-muted-foreground/80">
                Log in to your TRC Athena account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    className="focus:ring-2 focus:ring-primary/30"
                    required
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
                    className="focus:ring-2 focus:ring-primary/30"
                    required
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
                      Logging In...
                    </>
                  ) : (
                    <>
                      <UserRound className="mr-2 h-4 w-4" />
                      Log In
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
                  Sign In with Google
                </Button> */}
              </form>

              <div className="mt-6 text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="underline underline-offset-4 hover:text-primary">
                  Sign up
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
