import type { Metadata, Viewport } from "next"
import { Heebo } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import "./globals.css"

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  display: "swap",
  variable: "--font-heebo",
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
}

export const metadata: Metadata = {
  metadataBase: new URL("https://krav-milim.com"),
  title: "קרב מילים",
  description: "קרב מילים הוא משחק ניחוש מילים יומי בעברית. נחש את המילה הסודית תוך שש ניחושים, השווה תוצאות עם שאר השחקנים, ועלה בדירוג היומי.",
  alternates: {
    canonical: "https://krav-milim.com",
  },
  openGraph: {
    title: "קרב מילים",
    description: "משחק ניחוש מילים תחרותי בעברית — מילה יומית אחת לכולם",
    url: "https://krav-milim.com",
    siteName: "קרב מילים",
    images: [{ url: "/og-image.png", width: 400, height: 218, alt: "קרב מילים" }],
    locale: "he_IL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "קרב מילים",
    description: "משחק ניחוש מילים תחרותי בעברית — מילה יומית אחת לכולם",
    images: ["/og-image.png"],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable} suppressHydrationWarning>
      <head>
        {/* Runs before first paint to set data-theme without flash */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var s=localStorage.getItem('krav-milim-theme');var d=s==='light'?'light':s==='dark'?'dark':window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.setAttribute('data-theme',d)}catch(e){}})()` }} />
      </head>
      <body className="antialiased">
        {children}
        <Analytics />
        <SpeedInsights />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "קרב מילים",
              applicationCategory: "GameApplication",
              operatingSystem: "Web Browser",
              inLanguage: "he",
              url: "https://krav-milim.com",
              description: "משחק ניחוש מילים יומי בעברית",
              offers: { "@type": "Offer", price: "0", priceCurrency: "ILS" },
            }),
          }}
        />
      </body>
    </html>
  )
}
