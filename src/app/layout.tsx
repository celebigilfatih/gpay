import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { NextAuthProvider } from "@/components/providers/next-auth-provider";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial'],
});

export const metadata: Metadata = {
  title: "GPay - Financial Advisory",
  description: "Stock market advisory services",
  robots: "index, follow",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <head>
        {/* DNS Prefetch for external resources */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
        
        {/* Preconnect for critical resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        
        {/* Performance hints */}
        <meta httpEquiv="x-dns-prefetch-control" content="on" />
      </head>
      <body className={inter.className}>
        <NextAuthProvider>{children}</NextAuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
