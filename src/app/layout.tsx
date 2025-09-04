import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { GameConfigProvider } from "@/hooks/use-game-config";
import { EventProvider } from "@/hooks/use-event-config";
import { ServiceWorkerManager } from "@/components/service-worker-manager";
import { Toaster } from "sonner";
import { SessionProvider } from "@/components/session-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "TRC Scouting",
  description: "Scouting app for TRC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <html lang="en" suppressHydrationWarning>
        <head>
          {/* <link rel="manifest" href="/manifest" /> */}
        </head>
        <body className={inter.className}>
          <SessionProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <GameConfigProvider>
                <EventProvider>
                  {children}
                </EventProvider>
              </GameConfigProvider>
              <Toaster />
              <ServiceWorkerManager />
            </ThemeProvider>
          </SessionProvider>
        </body>
      </html>
    </>
  )
}
