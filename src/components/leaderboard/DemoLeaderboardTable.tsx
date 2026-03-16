"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import type { LeaderboardGlobalRow, LeaderboardAlltimeRow } from "@/types/shared"
import AvatarDisplay from "@/components/avatar/AvatarDisplay"
import type { AvatarConfig } from "@/lib/avatar/styles"
import { getAnonymousName } from "@/lib/anonymousName"

interface DemoResult {
  guesses: number
  solved:  boolean
}

interface Props {
  daily:   LeaderboardGlobalRow[]
  alltime: LeaderboardAlltimeRow[]
}

type Tab = "daily" | "alltime"

export default function DemoLeaderboardTable({ daily, alltime }: Props) {
  const [tab, setTab] = useState<Tab>("daily")
  const [demoResult, setDemoResult] = useState<DemoResult | null>(null)
  const [anonName, setAnonName] = useState<string>("")

  useEffect(() => {
    setAnonName(getAnonymousName())
    const stored = sessionStorage.getItem("demo-result")
    if (stored) {
      try { setDemoResult(JSON.parse(stored)) } catch { /* ignore */ }
    }
  }, [])

  // Inject ghost row into the daily leaderboard at the correct position
  const dailyWithDemo = (() => {
    if (!demoResult) return { rows: daily, demoRank: null }

    // Daily ranks: solved DESC, guesses ASC
    let insertAt = daily.length
    for (let i = 0; i < daily.length; i++) {
      const row = daily[i]
      if (!demoResult.solved && row.solved) continue
      if (demoResult.solved && !row.solved) { insertAt = i; break }
      if (demoResult.solved && row.solved && demoResult.guesses < (row.guesses ?? 99)) {
        insertAt = i
        break
      }
    }

    const demoRank = insertAt + 1
    return { rows: daily, demoRank }
  })()

  return (
    <div className="space-y-4">
      {/* Sign-up banner */}
      <div className="rounded-xl bg-green-900/30 border border-green-700/50 px-4 py-3 text-sm text-green-300 text-center">
        הירשם כדי להתחרות בדירוג ולהופיע כאן באופן קבוע
        <Link href="/signup" className="mr-2 underline font-medium">הרשמה חינם ←</Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(["daily", "alltime"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === t
                ? "bg-green-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {t === "daily" ? "היום" : "כל הזמנים"}
          </button>
        ))}
      </div>

      <table className="w-full text-base sm:text-lg">
        <thead>
          <tr className="border-b text-gray-400 text-right">
            <th className="py-2 sm:py-3 font-medium">#</th>
            <th className="py-2 sm:py-3 font-medium">שחקן</th>
            <th className="py-2 sm:py-3 font-medium">ניחושים</th>
            {tab === "alltime" && <th className="py-2 sm:py-3 font-medium">נצחונות</th>}
            {tab === "alltime" && <th className="py-2 sm:py-3 font-medium">רצף</th>}
          </tr>
        </thead>
        <tbody>
          {tab === "daily" ? (
            <>
              {daily.map((row, i) => {
                const rank = i + 1
                // Insert ghost row before this row if demo rank matches
                const showGhost = demoResult && dailyWithDemo.demoRank === rank
                return (
                  <React.Fragment key={row.user_id}>
                    {showGhost && anonName && (
                      <tr className="border-b last:border-0 bg-green-900/20">
                        <td className="py-2.5 sm:py-3 text-green-400">{dailyWithDemo.demoRank}</td>
                        <td className="py-2.5 sm:py-3">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <AvatarDisplay config={null} username={anonName} size={32} className="sm:hidden" />
                            <AvatarDisplay config={null} username={anonName} size={44} className="hidden sm:block" />
                            <span className="font-medium text-green-300">{anonName} <span className="text-xs font-normal">(אתה)</span></span>
                          </div>
                        </td>
                        <td className="py-2.5 sm:py-3 text-green-300">
                          {demoResult.solved ? demoResult.guesses : "X"}
                        </td>
                      </tr>
                    )}
                    <tr className="border-b last:border-0">
                      <td className="py-2.5 sm:py-3 text-gray-400">{row.rank}</td>
                      <td className="py-2.5 sm:py-3">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <AvatarDisplay config={row.avatar_config as AvatarConfig | null} username={row.username ?? ""} size={32} className="sm:hidden" />
                          <AvatarDisplay config={row.avatar_config as AvatarConfig | null} username={row.username ?? ""} size={44} className="hidden sm:block" />
                          <span className="font-medium">{row.username}</span>
                          {row.gibor_badge && (
                            <span className="relative group text-base leading-none cursor-default outline-none" tabIndex={0}>
                              💪
                              <span className="absolute bottom-full right-0 mb-1.5 rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-gray-300 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity pointer-events-none z-10">
                                שיחק ברצף במצב גיבור
                              </span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 sm:py-3">{row.solved ? row.guesses : "X"}</td>
                    </tr>
                  </React.Fragment>
                )
              })}
              {/* Ghost row at the end if demo rank is after all real rows */}
              {demoResult && anonName && dailyWithDemo.demoRank === daily.length + 1 && (
                <tr key="demo-ghost-end" className="border-b last:border-0 bg-green-900/20">
                  <td className="py-2.5 sm:py-3 text-green-400">{dailyWithDemo.demoRank}</td>
                  <td className="py-2.5 sm:py-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <AvatarDisplay config={null} username={anonName} size={32} className="sm:hidden" />
                      <AvatarDisplay config={null} username={anonName} size={44} className="hidden sm:block" />
                      <span className="font-medium text-green-300">{anonName} <span className="text-xs font-normal">(אתה)</span></span>
                    </div>
                  </td>
                  <td className="py-2.5 sm:py-3 text-green-300">
                    {demoResult.solved ? demoResult.guesses : "X"}
                  </td>
                </tr>
              )}
            </>
          ) : (
            alltime.map((row) => (
              <tr key={row.user_id} className="border-b last:border-0">
                <td className="py-2.5 sm:py-3 text-gray-400">{row.rank}</td>
                <td className="py-2.5 sm:py-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <AvatarDisplay config={row.avatar_config as AvatarConfig | null} username={row.username ?? ""} size={32} className="sm:hidden" />
                    <AvatarDisplay config={row.avatar_config as AvatarConfig | null} username={row.username ?? ""} size={44} className="hidden sm:block" />
                    <span className="font-medium">{row.username}</span>
                    {row.gibor_badge && (
                      <span className="relative group text-base leading-none cursor-default outline-none" tabIndex={0}>
                        💪
                        <span className="absolute bottom-full right-0 mb-1.5 rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-gray-300 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity pointer-events-none z-10">
                          שיחק ברצף במצב גיבור
                        </span>
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-2.5 sm:py-3">{row.avg_guesses}</td>
                <td className="py-2.5 sm:py-3">{row.total_wins}</td>
                <td className="py-2.5 sm:py-3 text-gray-400">{row.current_streak || "—"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
