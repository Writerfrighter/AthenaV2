import type { Metadata } from "next";
// import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { GameConfigProvider } from "@/hooks/use-game-config";
import { EventProvider } from "@/hooks/use-event-config";
import { ServiceWorkerManager } from "@/components/service-worker-manager";
import { SessionProvider } from "@/components/session-provider";
import { SonnerToaster } from "@/components/sonner-toaster";

// const inter = Inter({
//   variable: "--font-inter",
//   subsets: ["latin"],
// })

export const metadata: Metadata = {
  title: "TRC Scouting",
  description: "Scouting app for TRC",
  icons: {
    apple: '/TRCLogo.webp',
  },
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
        </head>
        <body className="font-sans">{/* className={inter.className} */}
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
              <SonnerToaster />
              <ServiceWorkerManager />
            </ThemeProvider>
          </SessionProvider>
        </body>
      </html>
    </>
  )
}
