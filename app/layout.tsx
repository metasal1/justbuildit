import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Rubik_Pixels } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});

const rubikPixels = Rubik_Pixels({
  variable: "--font-rubik-pixels",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const SITE_URL = "https://justbuildit.lol";
const SITE_NAME = "just build it";
const SITE_TAGLINE = "stop overthinking. ship something today.";
const OG_IMAGE = "/images/opengraph.png?v=4";
// Hardcoded at build (static export). MILYSEC property justbuildit.lol.
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-75Z5E0HRNC";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_TAGLINE,
  applicationName: SITE_NAME,
  keywords: [
    "solana",
    "build",
    "ship",
    "weekend hack",
    "web3",
    "developer tools",
    "indie hacker",
    "just build it",
  ],
  authors: [{ name: "metasal", url: "https://metasal.xyz" }],
  creator: "metasal",
  publisher: "metasal",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_TAGLINE,
    locale: "en_US",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "just build it — stop overthinking, ship something today",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_TAGLINE,
    creator: "@metasal",
    images: [OG_IMAGE],
  },
  category: "technology",
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

const cfBeaconToken = process.env.NEXT_PUBLIC_CF_BEACON_TOKEN;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaEnabled = GA_ID.startsWith("G-") && !GA_ID.includes("PLACEHOLDER");

  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${rubikPixels.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-black text-white overflow-x-hidden font-sans">
        {children}
        {gaEnabled && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`}
            </Script>
          </>
        )}
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
