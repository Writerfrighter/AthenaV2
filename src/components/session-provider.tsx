'use client'

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react"

export function SessionProvider({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <NextAuthSessionProvider
      refetchInterval={60 * 60} // Refetch every hour instead of default 5 minutes
      refetchOnWindowFocus={false} // Disable refetch on window focus to avoid issues when offline
      refetchWhenOffline={false} // Disable refetch when offline (if supported)
    >
      {children}
    </NextAuthSessionProvider>
  )
}
