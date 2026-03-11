"use client"

import { useEffect, useState } from "react"

type Theme = "system" | "light" | "dark"

const STORAGE_KEY = "krav-milim-theme"

function applyTheme(theme: Theme) {
  const resolved =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      : theme
  document.documentElement.setAttribute("data-theme", resolved)
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system")

  // Read stored preference on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
    if (stored === "light" || stored === "dark" || stored === "system") {
      setTheme(stored)
    }
  }, [])

  // Re-apply whenever theme changes, and listen for OS changes when in system mode
  useEffect(() => {
    applyTheme(theme)
    if (theme !== "system") return

    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = () => applyTheme("system")
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [theme])

  function cycle() {
    const next: Theme = theme === "system" ? "light" : theme === "light" ? "dark" : "system"
    setTheme(next)
    localStorage.setItem(STORAGE_KEY, next)
  }

  const label = theme === "light" ? "מצב בהיר" : theme === "dark" ? "מצב כהה" : "ברירת מחדל"

  return (
    <button
      onClick={cycle}
      title={label}
      aria-label={label}
      className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
    >
      {theme === "light"  && <SunIcon />}
      {theme === "dark"   && <MoonIcon />}
      {theme === "system" && <SystemIcon />}
    </button>
  )
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2"  x2="12" y2="4"  />
      <line x1="12" y1="20" x2="12" y2="22" />
      <line x1="4.22"  y1="4.22"  x2="5.64"  y2="5.64"  />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="2"  y1="12" x2="4"  y2="12" />
      <line x1="20" y1="12" x2="22" y2="12" />
      <line x1="4.22"  y1="19.78" x2="5.64"  y2="18.36" />
      <line x1="18.36" y1="5.64"  x2="19.78" y2="4.22"  />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

function SystemIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  )
}
