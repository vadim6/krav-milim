"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

interface Stats {
  today: string
  todayWord: string | null
  playsToday: number
  solvedToday: number
  totalUsers: number
  totalPlays: number
  wordsScheduled: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [wordRevealed, setWordRevealed] = useState(false)

  useEffect(() => {
    fetch("/api/admin/stats")
      .then(r => r.json())
      .then(data => { setStats(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-8">
      <h1 className="text-2xl font-bold">לוח בקרה</h1>

      {loading ? (
        <p className="text-gray-500">טוען…</p>
      ) : !stats ? (
        <p className="text-red-400">שגיאה בטעינת נתונים</p>
      ) : (
        <>
          {/* Today's word */}
          <section className="bg-gray-900 rounded-xl p-5 flex flex-col gap-3">
            <h2 className="text-gray-400 text-sm font-medium uppercase tracking-wider">היום — {stats.today}</h2>
            <div className="flex gap-6 flex-wrap">
              <StatCard
                label="מילת היום"
                value={stats.todayWord ? (wordRevealed ? stats.todayWord : "•••••") : "—"}
                highlight={!stats.todayWord}
                action={stats.todayWord ? (
                  <button onClick={() => setWordRevealed(v => !v)} className="text-gray-500 hover:text-gray-300 transition-colors mt-1">
                    {wordRevealed ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                ) : undefined}
              />
              <StatCard label="משחקים" value={String(stats.playsToday)} />
              <StatCard
                label="פתרו"
                value={stats.playsToday ? `${stats.solvedToday}/${stats.playsToday}` : "—"}
              />
            </div>
          </section>

          {/* Global stats */}
          <section className="bg-gray-900 rounded-xl p-5 flex flex-col gap-3">
            <h2 className="text-gray-400 text-sm font-medium uppercase tracking-wider">סה"כ</h2>
            <div className="flex gap-6 flex-wrap">
              <StatCard label="משתמשים" value={String(stats.totalUsers)} />
              <StatCard label="משחקים" value={String(stats.totalPlays)} />
              <StatCard label="מילים מתוזמנות" value={String(stats.wordsScheduled)} highlight={stats.wordsScheduled < 3} />
            </div>
          </section>

          {!stats.todayWord && (
            <div className="bg-amber-900/30 border border-amber-700 rounded-xl p-4 text-amber-400 text-sm">
              ⚠️ אין מילה להיום! <Link href="/admin/words" className="underline font-medium">הוסף מילה עכשיו</Link>
            </div>
          )}
          {stats.wordsScheduled < 3 && stats.todayWord && (
            <div className="bg-amber-900/30 border border-amber-700 rounded-xl p-4 text-amber-400 text-sm">
              ⚠️ פחות מ-3 מילים מתוזמנות קדימה. <Link href="/admin/words" className="underline font-medium">הוסף מילים</Link>
            </div>
          )}
        </>
      )}

      {/* Quick links */}
      <nav className="grid grid-cols-3 gap-3 text-center text-sm">
        {[
          { href: "/admin/words",   label: "מילים",      icon: "📝" },
          { href: "/admin/users",   label: "משתמשים",    icon: "👥" },
          { href: "/admin/testing", label: "בדיקות",     icon: "🧪" },
        ].map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            className="bg-gray-900 hover:bg-gray-800 rounded-xl p-5 flex flex-col items-center gap-2 transition-colors"
          >
            <span className="text-2xl">{icon}</span>
            <span className="text-gray-300">{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}

function StatCard({ label, value, highlight, action }: { label: string; value: string; highlight?: boolean; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-gray-500">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`text-2xl font-bold ${highlight ? "text-amber-400" : "text-white"}`}>{value}</span>
        {action}
      </div>
    </div>
  )
}

function EyeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}
