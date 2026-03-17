"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const TABS = [
  {
    href: "/game",
    label: "משחק",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <rect x="2" y="6" width="20" height="14" rx="3" />
        <path d="M8 13h2m2 0h2M13 11v2" strokeLinecap="round" />
        <path d="M8 3l1.5 3M16 3l-1.5 3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/leaderboard",
    label: "דירוג",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path d="M3 20h18M7 20V10M12 20V4M17 20v-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/rivalries",
    label: "יריבויות",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "פרופיל",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
]

export default function MobileNav({ isDev }: { isDev?: boolean }) {
  const pathname = usePathname()

  return (
    <nav className={`sm:hidden fixed bottom-0 inset-x-0 z-20 bg-white dark:bg-gray-900 pb-safe border-t ${isDev ? "border-red-600 border-t-2" : "border-gray-200 dark:border-gray-700"}`}>
      <div className="flex">
        {TABS.map(({ href, label, icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors ${
                active
                  ? "text-green-600 dark:text-green-400"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              {icon}
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
