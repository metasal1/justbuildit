import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
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
  title: "just build it",
  description: "Stop overthinking. Ship something on Solana. → solana.new",
  openGraph: {
    title: "just build it",
    description: "Stop overthinking. Ship something on Solana.",
    url: "https://justbuildit.lol",
    siteName: "just build it",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "just build it",
    description: "Stop overthinking. Ship something on Solana.",
  },
};

const cfBeaconToken = process.env.NEXT_PUBLIC_CF_BEACON_TOKEN;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-black text-white overflow-x-hidden">
        {children}
        {cfBeaconToken && (
          <Script
            strategy="afterInteractive"
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon={`{"token": "${cfBeaconToken}"}`}
          />
        )}
      </body>
    </html>
  );
}
