import type { Metadata } from "next";
import { Syne, DM_Serif_Display, Azeret_Mono, Archivo_Black, DM_Mono, Righteous, Bebas_Neue, DM_Sans, JetBrains_Mono, Orbitron, Share_Tech_Mono, Rajdhani } from "next/font/google";
import "./globals.css";
import { WebSocketProvider } from "@/lib/websocket";
import { SpotifyProvider } from "@/lib/spotify-sdk";
import { RadioProvider } from "@/lib/radio-station";
import { Player } from "@/components/player";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { AuthInitializer } from "@/components/auth-initializer";
import { KeyboardShortcutsProvider } from "@/components/keyboard-shortcuts-provider";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { MobileNav } from "@/components/mobile-nav";
import { QueryProvider } from "@/providers/query-provider";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const dmSerif = DM_Serif_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400"],
});

const azeretMono = Azeret_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const archivoBlack = Archivo_Black({
  variable: "--font-archivo-black",
  subsets: ["latin"],
  weight: ["400"],
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

const righteous = Righteous({
  variable: "--font-righteous",
  subsets: ["latin"],
  weight: ["400"],
});

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas-neue",
  subsets: ["latin"],
  weight: ["400"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const shareTechMono = Share_Tech_Mono({
  variable: "--font-share-tech-mono",
  subsets: ["latin"],
  weight: ["400"],
});

const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "BOOMBOX",
  description: "Your social radio station - Listen together, discover music, vibe with friends",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BOOMBOX",
    startupImage: [
      {
        url: "/icons/icon-512x512.png",
        media: "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)", // iPhone 14
      },
      {
        url: "/icons/icon-512x512.png",
        media: "(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)", // iPhone 14 Pro Max
      },
    ],
  },
  icons: {
    apple: [
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,  // Allow zoom for accessibility
  userScalable: true,  // Allow pinch-to-zoom for accessibility
  viewportFit: "cover",  // For notched devices (iPhone X and newer)
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FF6B6B" },
    { media: "(prefers-color-scheme: dark)", color: "#1a0a25" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${syne.variable} ${dmSerif.variable} ${azeretMono.variable} ${archivoBlack.variable} ${dmMono.variable} ${righteous.variable} ${bebasNeue.variable} ${dmSans.variable} ${jetBrainsMono.variable} ${orbitron.variable} ${shareTechMono.variable} ${rajdhani.variable} antialiased bg-background text-foreground font-sans`}
      >
        {/* Skip to main content link for accessibility */}
        <a href="#main-content" className="skip-to-content">
          Skip to main content
        </a>

        <ErrorBoundary>
          <QueryProvider>
            <AuthInitializer />
            <KeyboardShortcutsProvider />
            <ServiceWorkerRegister />
            <WebSocketProvider>
              <SpotifyProvider>
                <RadioProvider>
                  <main id="main-content">
                    {children}
                  </main>
                  <Player />
                  <MobileNav />
                  <PWAInstallPrompt />
                </RadioProvider>
              </SpotifyProvider>
            </WebSocketProvider>
          </QueryProvider>
        </ErrorBoundary>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
