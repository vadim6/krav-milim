"use client"

import { useState } from "react"
import type { LeaderboardGlobalRow, LeaderboardAlltimeRow } from "@/types/shared"
import AvatarDisplay from "@/components/avatar/AvatarDisplay"
import type { AvatarConfig } from "@/lib/avatar/styles"

interface Props {
  daily:   LeaderboardGlobalRow[]
  alltime: LeaderboardAlltimeRow[]
}

export default function LeaderboardTable({ daily, alltime }: Props) {
  const [tab, setTab] = useState<"daily" | "alltime">("daily")

  return (
    <div className="space-y-4">
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
          {tab === "daily"
            ? daily.map((row) => (
                <tr key={row.user_id} className="border-b last:border-0">
                  <td className="py-2.5 sm:py-3 text-gray-400">{row.rank}</td>
                  <td className="py-2.5 sm:py-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <AvatarDisplay
                        config={row.avatar_config as AvatarConfig | null}
                        username={row.username ?? ""}
                        size={32}
                        className="sm:hidden"
                      />
                      <AvatarDisplay
                        config={row.avatar_config as AvatarConfig | null}
                        username={row.username ?? ""}
                        size={44}
                        className="hidden sm:block"
                      />
                      <span className="font-medium">{row.username}</span>
                    </div>
                  </td>
                  <td className="py-2.5 sm:py-3">{row.solved ? row.guesses : "X"}</td>
                </tr>
              ))
            : alltime.map((row) => (
                <tr key={row.user_id} className="border-b last:border-0">
                  <td className="py-2.5 sm:py-3 text-gray-400">{row.rank}</td>
                  <td className="py-2.5 sm:py-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <AvatarDisplay
                        config={row.avatar_config as AvatarConfig | null}
                        username={row.username ?? ""}
                        size={32}
                        className="sm:hidden"
                      />
                      <AvatarDisplay
                        config={row.avatar_config as AvatarConfig | null}
                        username={row.username ?? ""}
                        size={44}
                        className="hidden sm:block"
                      />
                      <span className="font-medium">{row.username}</span>
                    </div>
                  </td>
                  <td className="py-2.5 sm:py-3">{row.avg_guesses}</td>
                  <td className="py-2.5 sm:py-3">{row.total_wins}</td>
                  <td className="py-2.5 sm:py-3 text-gray-400">{row.current_streak || "—"}</td>
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  )
}
