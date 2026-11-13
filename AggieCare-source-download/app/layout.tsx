import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://aggie-care-now.byebyelittlemouse.chatgpt.site"),
  title: "Aggie Care — Search UC Davis resources",
  description: "An installable, typo-tolerant campus search app for food, health, mental health, free supplies, and student support at UC Davis.",
  manifest: "/manifest.webmanifest",
  applicationName: "Aggie Care",
  appleWebApp: { capable: true, title: "Aggie Care", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: true },
  openGraph: {
    title: "Aggie Care — Find what you need, right now.",
    description: "Smart search for UC Davis food, health, supplies, and support.",
    images: [{ url: "/og.png", width: 1728, height: 907, alt: "Aggie Care — Feel better. Right now." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Aggie Care — Find what you need, right now.",
    description: "Smart search for UC Davis food, health, supplies, and support.",
    images: ["/og.png"],
  },
  icons: {
    icon: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
    shortcut: "/icon-192.png",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  other: { "theme-color": "#142b24", "mobile-web-app-capable": "yes" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
