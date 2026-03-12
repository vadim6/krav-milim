import type { Metadata } from "next"
import { Heebo } from "next/font/google"
import "./globals.css"

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  display: "swap",
  variable: "--font-heebo",
})

export const metadata: Metadata = {
  title: "קרב מילים",
  description: "משחק מילים תחרותי בעברית",
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
      <body className="antialiased">{children}</body>
    </html>
  )
}
