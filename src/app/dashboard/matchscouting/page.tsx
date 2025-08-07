'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, ArrowRight } from "lucide-react"

export default function Page() {
    const router = useRouter()
    
    useEffect(() => {
        const timer = setTimeout(() => {
            router.push('/scout/matchscout')
        }, 3000)
        
        return () => clearTimeout(timer)
    }, [router])
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center">
            <Card className="max-w-md mx-auto">
                <CardContent className="pt-6">
                    <div className="text-center space-y-4">
                        <div className="flex justify-center">
                            <div className="p-3 bg-muted rounded-full">
                                <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold">
                                Redirecting to Match Scouting
                            </h2>
                            <p className="text-sm text-muted-foreground mt-2">
                                Match scouting has moved to a new location
                            </p>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                            <span>Taking you there in 3 seconds</span>
                            <ArrowRight className="h-4 w-4" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}