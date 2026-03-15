"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"

function CogIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

export default function SettingsButton() {
  const [open, setOpen] = useState(false)
  const [giborMode, setGiborMode] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setGiborMode(localStorage.getItem("krav-milim-gibor-mode") === "true")
  }, [open])

  function handleToggle() {
    const inProgress = localStorage.getItem("krav-milim-game-in-progress") === "true"
    if (inProgress) {
      setError("ניתן לשנות הגדרות רק לפני תחילת המשחק")
      setTimeout(() => setError(null), 3000)
      return
    }
    const next = !giborMode
    localStorage.setItem("krav-milim-gibor-mode", String(next))
    setGiborMode(next)
    setError(null)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="הגדרות"
        className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <CogIcon />
      </button>

      {open && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl p-6 w-full max-w-sm text-right"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-5">הגדרות</h2>

            <div className="space-y-4">
              {/* Gibor Mode toggle */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-sm">מצב גיבור</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    אותיות שנחשפו חייבות להופיע בניחושים הבאים
                  </p>
                </div>
                <button
                  onClick={handleToggle}
                  role="switch"
                  aria-checked={giborMode}
                  className={`relative shrink-0 w-11 h-6 rounded-full transition-colors focus:outline-none ${
                    giborMode ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      giborMode ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              {/* Error message */}
              {error && (
                <p className="text-sm text-red-500 font-medium text-center">{error}</p>
              )}
            </div>

            <button
              onClick={() => setOpen(false)}
              className="mt-6 w-full rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 py-2 text-sm font-medium transition-colors"
            >
              סגור
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
