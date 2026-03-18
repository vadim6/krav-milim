"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import Image from "next/image"
import logo from "@/app/krav_milim_logo.png"

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.341-3.369-1.341-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
    </svg>
  )
}

function LinkedInIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

export default function AboutButton({ initialOpen = false, showLabel = false }: { initialOpen?: boolean; showLabel?: boolean }) {
  const [open, setOpen] = useState(initialOpen)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="אודות"
        className="flex items-center gap-1 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors px-2 py-1 text-base font-bold"
      >
        {showLabel ? <span className="text-sm font-medium">הוראות</span> : "?"}
      </button>

      {mounted && open && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl p-6 w-full max-w-sm text-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center mb-4">
              <Image src={logo} alt="קרב מילים" height={128} />
            </div>
            <h2 className="text-xl font-bold mb-4">אודות קרב מילים</h2>
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              <p>
                קרב מילים הוא משחק ניחוש מילים יומי בעברית.
                כל יום מילה חדשה — 6 ניסיונות לנחש אותה.
              </p>
              <div className="space-y-1">
                <p className="font-semibold text-gray-800 dark:text-gray-200">איך משחקים?</p>
                <p>הכנס מילה בת 5 אותיות ולחץ Enter.</p>
                <div className="flex flex-col gap-1 mt-2 text-xs">
                  <span><span className="font-bold text-green-600">ירוק</span> — האות במקום הנכון</span>
                  <span><span className="font-bold text-yellow-500">צהוב</span> — האות במילה אך במקום שגוי</span>
                  <span><span className="font-bold text-gray-500">אפור</span> — האות לא במילה</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between gap-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                פותח 100% בוייב קודינג בלי בושה ע״י ודים פרגר עם Claude Code
              </p>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href="https://github.com/vadim6"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                  className="text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  <GitHubIcon />
                </a>
                <a
                  href="https://www.linkedin.com/in/vadimfreger/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <LinkedInIcon />
                </a>
              </div>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="mt-4 w-full rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 py-2 text-sm font-medium transition-colors"
            >
              סגור
            </button>

            <div className="mt-3 text-left text-[10px] text-gray-300 dark:text-gray-600 space-y-0.5 font-mono" dir="ltr">
              {process.env.NEXT_PUBLIC_BUILD_TIME && (
                <p>deployed (UTC): {new Date(process.env.NEXT_PUBLIC_BUILD_TIME).toLocaleString("utc", { timeZone: "UTC", hour12: false })}</p>
              )}
              {process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA && (
                <p>sha: {process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA.slice(0, 7)}</p>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
