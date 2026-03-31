"use client"

import { useState } from "react"
import type {
  LeaderboardGlobalRow,
  LeaderboardAlltimeRow,
  LeaderboardWeeklyRow,
  LeaderboardMonthlyRow,
} from "@/types/shared"
import AvatarDisplay from "@/components/avatar/AvatarDisplay"
import type { AvatarConfig } from "@/lib/avatar/styles"

type Tab = "daily" | "weekly" | "monthly" | "alltime"

interface Props {
  daily:   LeaderboardGlobalRow[]
  alltime: LeaderboardAlltimeRow[]
  weekly:  LeaderboardWeeklyRow[]
  monthly: LeaderboardMonthlyRow[]
}

const TAB_CONFIG: { key: Tab; label: string }[] = [
  { key: "daily",   label: "היום" },
  { key: "weekly",  label: "שבועי" },
  { key: "monthly", label: "חודשי" },
  { key: "alltime", label: "כל הזמנים" },
]

/** Tier badge based on rank position */
function getTierBadge(rank: number | null): { emoji: string; label: string; color: string } | null {
  if (rank == null) return null
  if (rank === 1) return { emoji: "👑", label: "מלך המילים", color: "text-yellow-400" }
  if (rank === 2) return { emoji: "💎", label: "יהלום", color: "text-cyan-400" }
  if (rank === 3) return { emoji: "🥇", label: "זהב", color: "text-yellow-500" }
  if (rank <= 5)  return { emoji: "🥈", label: "כסף", color: "text-gray-300" }
  if (rank <= 10) return { emoji: "🥉", label: "ארד", color: "text-amber-600" }
  return null
}

/** Podium row styling for top 3 */
function getPodiumClass(rank: number | null): string {
  if (rank === 1) return "bg-yellow-500/10 dark:bg-yellow-400/10"
  if (rank === 2) return "bg-cyan-500/8 dark:bg-cyan-400/8"
  if (rank === 3) return "bg-amber-500/8 dark:bg-amber-400/8"
  return ""
}

function RankCell({ rank }: { rank: number | null }) {
  const tier = getTierBadge(rank)
  if (tier) {
    return (
      <span className="relative group cursor-default outline-none" tabIndex={0}>
        <span className="text-lg">{tier.emoji}</span>
        <span className="absolute bottom-full right-0 mb-1.5 rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-gray-300 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity pointer-events-none z-10">
          {tier.label}
        </span>
      </span>
    )
  }
  return <span className="text-gray-400">{rank}</span>
}

function PlayerCell({ username, avatarConfig, giborBadge }: {
  username: string | null
  avatarConfig: unknown
  giborBadge: boolean | null
}) {
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <AvatarDisplay
        config={avatarConfig as AvatarConfig | null}
        username={username ?? ""}
        size={32}
        className="sm:hidden"
      />
      <AvatarDisplay
        config={avatarConfig as AvatarConfig | null}
        username={username ?? ""}
        size={44}
        className="hidden sm:block"
      />
      <span className="font-medium">{username}</span>
      {giborBadge && (
        <span className="relative group text-base leading-none cursor-default outline-none" tabIndex={0}>
          💪
          <span className="absolute bottom-full right-0 mb-1.5 rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-gray-300 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity pointer-events-none z-10">
            שיחק ברצף במצב גיבור
          </span>
        </span>
      )}
    </div>
  )
}

/** Streak fire badge for active streaks >= 3 */
function StreakBadge({ streak }: { streak: number | null }) {
  if (!streak || streak < 3) return <span className="text-gray-400">{streak || "—"}</span>
  return (
    <span className="relative group cursor-default outline-none" tabIndex={0}>
      <span>{streak}</span>
      <span className="mr-0.5">🔥</span>
      <span className="absolute bottom-full right-0 mb-1.5 rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-gray-300 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity pointer-events-none z-10">
        רצף של {streak} ימים!
      </span>
    </span>
  )
}

/** Perfect game indicator for 1-guess solves */
function PerfectBadge({ count }: { count: number | null }) {
  if (!count || count === 0) return <span>0</span>
  return (
    <span className="relative group cursor-default outline-none" tabIndex={0}>
      <span>{count}</span>
      <span className="mr-0.5 text-purple-400">⚡</span>
      <span className="absolute bottom-full right-0 mb-1.5 rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-gray-300 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity pointer-events-none z-10">
        {count === 1 ? "ניחוש מושלם!" : `${count} ניחושים מושלמים!`}
      </span>
    </span>
  )
}

/** Win rate bar */
function WinRateCell({ rate }: { rate: number | null }) {
  const pct = rate ?? 0
  const barColor =
    pct >= 90 ? "bg-green-500" :
    pct >= 70 ? "bg-lime-500" :
    pct >= 50 ? "bg-yellow-500" :
    "bg-red-400"

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm tabular-nums w-[3ch] text-left">{pct}%</span>
      <div className="hidden sm:block w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default function LeaderboardTable({ daily, alltime, weekly, monthly }: Props) {
  const [tab, setTab] = useState<Tab>("daily")

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {TAB_CONFIG.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors whitespace-nowrap ${
              tab === key
                ? "bg-green-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Period info */}
      {tab === "weekly" && (
        <p className="text-xs text-gray-500">
          שבוע נוכחי — מתאפס כל יום שני
        </p>
      )}
      {tab === "monthly" && (
        <p className="text-xs text-gray-500">
          חודש נוכחי — מתאפס בתחילת כל חודש
        </p>
      )}

      {/* Empty state */}
      {((tab === "daily" && daily.length === 0) ||
        (tab === "weekly" && weekly.length === 0) ||
        (tab === "monthly" && monthly.length === 0) ||
        (tab === "alltime" && alltime.length === 0)) && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-3xl mb-2">🏆</p>
          <p className="font-medium">עדיין אין תוצאות</p>
          <p className="text-sm mt-1">שחקו כדי להופיע בטבלה!</p>
        </div>
      )}

      {/* Daily table */}
      {tab === "daily" && daily.length > 0 && (
        <table className="w-full text-base sm:text-lg">
          <thead>
            <tr className="border-b text-gray-400 text-right">
              <th className="py-2 sm:py-3 font-medium">#</th>
              <th className="py-2 sm:py-3 font-medium">שחקן</th>
              <th className="py-2 sm:py-3 font-medium">ניחושים</th>
            </tr>
          </thead>
          <tbody>
            {daily.map((row) => (
              <tr key={row.user_id} className={`border-b last:border-0 ${getPodiumClass(row.rank)}`}>
                <td className="py-2.5 sm:py-3"><RankCell rank={row.rank} /></td>
                <td className="py-2.5 sm:py-3">
                  <PlayerCell
                    username={row.username}
                    avatarConfig={row.avatar_config}
                    giborBadge={row.gibor_badge}
                  />
                </td>
                <td className="py-2.5 sm:py-3">
                  {row.solved ? (
                    <span>
                      {row.guesses}
                      {row.guesses === 1 && <span className="mr-1 text-purple-400">⚡</span>}
                    </span>
                  ) : "X"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Weekly table */}
      {tab === "weekly" && weekly.length > 0 && (
        <table className="w-full text-base sm:text-lg">
          <thead>
            <tr className="border-b text-gray-400 text-right">
              <th className="py-2 sm:py-3 font-medium">#</th>
              <th className="py-2 sm:py-3 font-medium">שחקן</th>
              <th className="py-2 sm:py-3 font-medium">נצחונות</th>
              <th className="py-2 sm:py-3 font-medium">ממוצע</th>
              <th className="py-2 sm:py-3 font-medium hidden sm:table-cell">אחוז</th>
              <th className="py-2 sm:py-3 font-medium hidden sm:table-cell">מושלם</th>
            </tr>
          </thead>
          <tbody>
            {weekly.map((row) => (
              <tr key={row.user_id} className={`border-b last:border-0 ${getPodiumClass(row.rank)}`}>
                <td className="py-2.5 sm:py-3"><RankCell rank={row.rank} /></td>
                <td className="py-2.5 sm:py-3">
                  <PlayerCell
                    username={row.username}
                    avatarConfig={row.avatar_config}
                    giborBadge={row.gibor_badge}
                  />
                </td>
                <td className="py-2.5 sm:py-3">
                  <span>{row.wins}</span>
                  <span className="text-gray-400 text-sm">/{row.games_played}</span>
                </td>
                <td className="py-2.5 sm:py-3">{row.avg_guesses ?? "—"}</td>
                <td className="py-2.5 sm:py-3 hidden sm:table-cell">
                  <WinRateCell rate={row.win_rate} />
                </td>
                <td className="py-2.5 sm:py-3 hidden sm:table-cell">
                  <PerfectBadge count={row.perfect_games} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Monthly table */}
      {tab === "monthly" && monthly.length > 0 && (
        <table className="w-full text-base sm:text-lg">
          <thead>
            <tr className="border-b text-gray-400 text-right">
              <th className="py-2 sm:py-3 font-medium">#</th>
              <th className="py-2 sm:py-3 font-medium">שחקן</th>
              <th className="py-2 sm:py-3 font-medium">נצחונות</th>
              <th className="py-2 sm:py-3 font-medium">ממוצע</th>
              <th className="py-2 sm:py-3 font-medium hidden sm:table-cell">אחוז</th>
              <th className="py-2 sm:py-3 font-medium hidden sm:table-cell">מושלם</th>
            </tr>
          </thead>
          <tbody>
            {monthly.map((row) => (
              <tr key={row.user_id} className={`border-b last:border-0 ${getPodiumClass(row.rank)}`}>
                <td className="py-2.5 sm:py-3"><RankCell rank={row.rank} /></td>
                <td className="py-2.5 sm:py-3">
                  <PlayerCell
                    username={row.username}
                    avatarConfig={row.avatar_config}
                    giborBadge={row.gibor_badge}
                  />
                </td>
                <td className="py-2.5 sm:py-3">
                  <span>{row.wins}</span>
                  <span className="text-gray-400 text-sm">/{row.games_played}</span>
                </td>
                <td className="py-2.5 sm:py-3">{row.avg_guesses ?? "—"}</td>
                <td className="py-2.5 sm:py-3 hidden sm:table-cell">
                  <WinRateCell rate={row.win_rate} />
                </td>
                <td className="py-2.5 sm:py-3 hidden sm:table-cell">
                  <PerfectBadge count={row.perfect_games} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* All-time table */}
      {tab === "alltime" && alltime.length > 0 && (
        <table className="w-full text-base sm:text-lg">
          <thead>
            <tr className="border-b text-gray-400 text-right">
              <th className="py-2 sm:py-3 font-medium">#</th>
              <th className="py-2 sm:py-3 font-medium">שחקן</th>
              <th className="py-2 sm:py-3 font-medium">ניחושים</th>
              <th className="py-2 sm:py-3 font-medium">נצחונות</th>
              <th className="py-2 sm:py-3 font-medium">רצף</th>
            </tr>
          </thead>
          <tbody>
            {alltime.map((row) => (
              <tr key={row.user_id} className={`border-b last:border-0 ${getPodiumClass(row.rank)}`}>
                <td className="py-2.5 sm:py-3"><RankCell rank={row.rank} /></td>
                <td className="py-2.5 sm:py-3">
                  <PlayerCell
                    username={row.username}
                    avatarConfig={row.avatar_config}
                    giborBadge={row.gibor_badge}
                  />
                </td>
                <td className="py-2.5 sm:py-3">{row.avg_guesses}</td>
                <td className="py-2.5 sm:py-3">{row.total_wins}</td>
                <td className="py-2.5 sm:py-3">
                  <StreakBadge streak={row.current_streak} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
