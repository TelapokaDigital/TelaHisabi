import type { Metadata, Viewport } from "next";
import "@fontsource-variable/manrope";
import "@fontsource/noto-sans-bengali";
import "@fontsource/noto-sans-bengali/500.css";
import "@fontsource/noto-sans-bengali/600.css";
import "@fontsource/noto-sans-bengali/700.css";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/app/providers";

export const metadata: Metadata = {
  title: "TELAPOKA — Shared Payment Tracker",
  description:
    "Privately track recurring money you collect from people — WiFi, rent, shared services. Monthly dues, payment history, reminders and reports.",
  applicationName: "TELAPOKA",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "TELAPOKA",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/brand/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/brand/apple-touch-icon.png",
  },
  openGraph: {
    title: "TELAPOKA — Shared Payment Tracker",
    description: "Collect together. Stay paid.",
    siteName: "TELAPOKA",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#E11D2E" },
    { media: "(prefers-color-scheme: dark)", color: "#171213" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground">
        <Providers>{children}</Providers>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
