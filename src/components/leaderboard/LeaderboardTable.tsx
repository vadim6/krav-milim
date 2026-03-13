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

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-gray-400 text-right">
            <th className="py-2 font-medium">#</th>
            <th className="py-2 font-medium">שחקן</th>
            <th className="py-2 font-medium">ניחושים</th>
            {tab === "alltime" && <th className="py-2 font-medium">נצחונות</th>}
            <th className="py-2 font-medium">זמן</th>
          </tr>
        </thead>
        <tbody>
          {tab === "daily"
            ? daily.map((row) => (
                <tr key={row.user_id} className="border-b last:border-0">
                  <td className="py-2 text-gray-400">{row.rank}</td>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <AvatarDisplay
                        config={row.avatar_config as AvatarConfig | null}
                        username={row.username ?? ""}
                        size={28}
                      />
                      <span className="font-medium">{row.username}</span>
                    </div>
                  </td>
                  <td className="py-2">{row.solved ? row.guesses : "X"}</td>
                  <td className="py-2 text-gray-400">
                    {row.duration_seconds != null
                      ? `${Math.floor(row.duration_seconds / 60)}:${String(row.duration_seconds % 60).padStart(2, "0")}`
                      : "—"}
                  </td>
                </tr>
              ))
            : alltime.map((row) => (
                <tr key={row.user_id} className="border-b last:border-0">
                  <td className="py-2 text-gray-400">{row.rank}</td>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <AvatarDisplay
                        config={row.avatar_config as AvatarConfig | null}
                        username={row.username ?? ""}
                        size={28}
                      />
                      <span className="font-medium">{row.username}</span>
                    </div>
                  </td>
                  <td className="py-2">{row.avg_guesses}</td>
                  <td className="py-2">{row.total_wins}</td>
                  <td className="py-2 text-gray-400">
                    {row.avg_duration_seconds != null
                      ? `${Math.round(row.avg_duration_seconds)}s`
                      : "—"}
                  </td>
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  )
}
