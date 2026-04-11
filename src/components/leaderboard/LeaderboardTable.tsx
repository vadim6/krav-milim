"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import type {
  LeaderboardGlobalRow,
  LeaderboardAlltimeRow,
  LeaderboardWeeklyRow,
  LeaderboardWeeklyPrevRow,
  LeaderboardMonthlyRow,
  LeaderboardMonthlyPrevRow,
} from "@/types/shared"
import AvatarDisplay from "@/components/avatar/AvatarDisplay"
import type { AvatarConfig } from "@/lib/avatar/styles"

function LeaderboardInfo() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="איך עובד הדירוג?"
        className="flex items-center justify-center w-7 h-7 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm font-bold shrink-0"
      >
        ?
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
            <h2 className="text-lg font-bold mb-4">איך עובד הדירוג?</h2>

            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              <div className="space-y-1.5">
                <p className="font-semibold text-gray-800 dark:text-gray-200">סדר הדירוג</p>
                <div className="space-y-1 text-xs">
                  <p><span className="font-medium text-gray-700 dark:text-gray-300">יום —</span> פחות ניחושים = מיקום גבוה יותר</p>
                  <p><span className="font-medium text-gray-700 dark:text-gray-300">שבועי / חודשי —</span> נצחונות ← ממוצע ניחושים ← רצף</p>
                  <p><span className="font-medium text-gray-700 dark:text-gray-300">כל הזמנים —</span> ממוצע ניחושים ← נצחונות ← רצף</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="font-semibold text-gray-800 dark:text-gray-200">סמלים</p>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none shrink-0">👑</span>
                    <span>שבוע מושלם (7/7) או חודש מושלם עד כה — מקום ראשון בלבד</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <img src="/superman.svg" width={18} height={18} alt="" className="shrink-0" />
                    <span>חודש קלנדרי מושלם — ניצחון כל יום בחודש</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none shrink-0">🔥</span>
                    <span>רצף ניצחונות פעיל של 7 ימים ומעלה</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none shrink-0">💪</span>
                    <span>שיחק ברצף במצב גיבור (לפחות יומיים רצוף)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none shrink-0">⚡</span>
                    <span>ניחש נכון בניסיון הראשון</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none shrink-0">🥇🥈🥉</span>
                    <span>מקומות 1–3 (כשיש 👑 — המדליות מתחילות ממקום 2)</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="mt-5 w-full rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 py-2 text-sm font-medium transition-colors"
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

type Tab = "daily" | "weekly" | "monthly" | "alltime"

interface Props {
  daily:        LeaderboardGlobalRow[]
  alltime:      LeaderboardAlltimeRow[]
  weekly:       LeaderboardWeeklyRow[]
  weeklyPrev:   LeaderboardWeeklyPrevRow[]
  monthly:      LeaderboardMonthlyRow[]
  monthlyPrev:  LeaderboardMonthlyPrevRow[]
}

const TAB_CONFIG: { key: Tab; label: string }[] = [
  { key: "daily",   label: "היום" },
  { key: "weekly",  label: "שבועי" },
  { key: "monthly", label: "חודשי" },
  { key: "alltime", label: "כל הזמנים" },
]

type SpecialIcon = "crown" | "superman" | null

/** Medal for top 3, nothing above rank 3 */
function getMedal(rank: number | null): { emoji: string; label: string } | null {
  if (rank == null) return null
  if (rank === 1) return { emoji: "🥇", label: "מקום ראשון" }
  if (rank === 2) return { emoji: "🥈", label: "מקום שני" }
  if (rank === 3) return { emoji: "🥉", label: "מקום שלישי" }
  return null
}


function RankCell({ rank, special = null, hasCrown = false }: { rank: number | null; special?: SpecialIcon; hasCrown?: boolean }) {
  // Superman: perfect full month — shown instead of medal for rank 1
  if (special === "superman" && rank === 1) {
    return (
      <span className="relative group cursor-default outline-none" tabIndex={0}>
        <img src="/superman.svg" alt="Superman" width={28} height={28} />
        <span className="absolute bottom-full right-0 mb-1.5 rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-gray-300 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity pointer-events-none z-10">
          חודש מושלם! 
        </span>
      </span>
    )
  }

  // Crown: perfect week / perfect month so far — shown instead of gold medal for rank 1
  if (special === "crown" && rank === 1) {
    return (
      <span className="relative group cursor-default outline-none" tabIndex={0}>
        <span className="text-lg">👑</span>
        <span className="absolute bottom-full right-0 mb-1.5 rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-gray-300 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity pointer-events-none z-10">
          מלך המילים! 
        </span>
      </span>
    )
  }

  // When a crown holder exists, everyone shifts down one medal tier
  const medalRank = hasCrown && rank != null ? rank - 1 : rank
  const medal = getMedal(medalRank)
  if (medal) {
    return (
      <span className="relative group cursor-default outline-none" tabIndex={0}>
        <span className="text-lg">{medal.emoji}</span>
        <span className="absolute bottom-full right-0 mb-1.5 rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-gray-300 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity pointer-events-none z-10">
          {medal.label}
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
    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
      <AvatarDisplay
        config={avatarConfig as AvatarConfig | null}
        username={username ?? ""}
        size={32}
        className="sm:hidden shrink-0"
      />
      <AvatarDisplay
        config={avatarConfig as AvatarConfig | null}
        username={username ?? ""}
        size={44}
        className="hidden sm:block shrink-0"
      />
      <span className="font-medium truncate">{username}</span>
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

/** Streak fire badge for active streaks >= 7 */
function StreakBadge({ streak }: { streak: number | null }) {
  if (!streak || streak < 7) return <span className="text-gray-400">{streak || "—"}</span>
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
      <span className="text-sm tabular-nums w-[4ch] text-left">{pct}%</span>
      <div className="hidden sm:block w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function PeriodToggle({ value, onChange, labels }: {
  value: "current" | "prev"
  onChange: (v: "current" | "prev") => void
  labels: [string, string]
}) {
  return (
    <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 w-fit text-xs font-medium">
      {(["current", "prev"] as const).map((v, i) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`px-3 py-1 transition-colors ${
            value === v
              ? "bg-gray-700 text-white dark:bg-gray-200 dark:text-gray-900"
              : "bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
          } ${i === 0 ? "border-l border-gray-200 dark:border-gray-700" : ""}`}
        >
          {labels[i]}
        </button>
      ))}
    </div>
  )
}

export default function LeaderboardTable({ daily, alltime, weekly, weeklyPrev, monthly, monthlyPrev }: Props) {
  const [tab, setTab] = useState<Tab>("daily")
  const [weeklyView, setWeeklyView] = useState<"current" | "prev">("current")
  const [monthlyView, setMonthlyView] = useState<"current" | "prev">("current")

  const activeWeekly = weeklyView === "current" ? weekly : weeklyPrev
  const activeMonthly = monthlyView === "current" ? monthly : monthlyPrev

  return (
    <div className="space-y-4 overflow-x-hidden">
      {/* Tab bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
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
        <div className="ml-auto shrink-0">
          <LeaderboardInfo />
        </div>
      </div>

      {/* Period info + sub-toggle for weekly */}
      {tab === "weekly" && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-gray-500">
            {weeklyView === "current" ? "שבוע נוכחי — מתאפס כל יום ראשון" : "שבוע קודם"}
          </p>
          <PeriodToggle value={weeklyView} onChange={setWeeklyView} labels={["שבוע נוכחי", "שבוע קודם"]} />
        </div>
      )}

      {/* Period info + sub-toggle for monthly */}
      {tab === "monthly" && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-gray-500">
            {monthlyView === "current" ? "חודש נוכחי — מתאפס בתחילת כל חודש" : "חודש קודם"}
          </p>
          <PeriodToggle value={monthlyView} onChange={setMonthlyView} labels={["חודש נוכחי", "חודש קודם"]} />
        </div>
      )}

      {/* Empty state */}
      {((tab === "daily" && daily.length === 0) ||
        (tab === "weekly" && activeWeekly.length === 0) ||
        (tab === "monthly" && activeMonthly.length === 0) ||
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
              <tr key={row.user_id} className="border-b last:border-0">
                <td className="py-2.5 sm:py-3"><span className="text-gray-400">{row.rank}</span></td>
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
      {tab === "weekly" && activeWeekly.length > 0 && (
        <table className="w-full table-fixed text-base sm:text-lg">
          <thead>
            <tr className="border-b text-gray-400 text-right">
              <th className="py-2 sm:py-3 font-medium w-8 sm:w-10">#</th>
              <th className="py-2 sm:py-3 font-medium w-[40%]">שחקן</th>
              <th className="py-2 sm:py-3 font-medium w-[15%]">נצחונות</th>
              <th className="py-2 sm:py-3 font-medium w-[12%]">ממוצע</th>
              <th className="py-2 sm:py-3 font-medium w-[15%] hidden sm:table-cell">אחוז</th>
              <th className="py-2 sm:py-3 font-medium w-[10%]">רצף</th>
            </tr>
          </thead>
          <tbody>
            {activeWeekly.map((row) => {
              const hasCrown = activeWeekly[0]?.perfect_week === true
              return (
                <tr key={row.user_id} className="border-b last:border-0">
                  <td className="py-2.5 sm:py-3">
                    <RankCell
                      rank={row.rank}
                      special={row.rank === 1 && row.perfect_week ? "crown" : null}
                      hasCrown={hasCrown}
                    />
                  </td>
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
                  <td className="py-2.5 sm:py-3">
                    <StreakBadge streak={row.current_streak} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {/* Monthly table */}
      {tab === "monthly" && activeMonthly.length > 0 && (
        <table className="w-full table-fixed text-base sm:text-lg">
          <thead>
            <tr className="border-b text-gray-400 text-right">
              <th className="py-2 sm:py-3 font-medium w-8 sm:w-10">#</th>
              <th className="py-2 sm:py-3 font-medium w-[40%]">שחקן</th>
              <th className="py-2 sm:py-3 font-medium w-[15%]">נצחונות</th>
              <th className="py-2 sm:py-3 font-medium w-[12%]">ממוצע</th>
              <th className="py-2 sm:py-3 font-medium w-[15%] hidden sm:table-cell">אחוז</th>
              <th className="py-2 sm:py-3 font-medium w-[10%]">רצף</th>
            </tr>
          </thead>
          <tbody>
            {activeMonthly.map((row) => {
              const hasCrown = activeMonthly[0]?.perfect_month_full === true || activeMonthly[0]?.perfect_month_running === true
              const special: SpecialIcon =
                row.rank === 1 && row.perfect_month_full    ? "superman" :
                row.rank === 1 && row.perfect_month_running ? "crown"    : null
              return (
                <tr key={row.user_id} className="border-b last:border-0">
                  <td className="py-2.5 sm:py-3"><RankCell rank={row.rank} special={special} hasCrown={hasCrown} /></td>
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
                  <td className="py-2.5 sm:py-3">
                    <StreakBadge streak={row.current_streak} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {/* All-time table */}
      {tab === "alltime" && alltime.length > 0 && (
        <table className="w-full table-fixed text-base sm:text-lg">
          <thead>
            <tr className="border-b text-gray-400 text-right">
              <th className="py-2 sm:py-3 font-medium w-8 sm:w-10">#</th>
              <th className="py-2 sm:py-3 font-medium">שחקן</th>
              <th className="py-2 sm:py-3 font-medium w-[13%]">ניחושים</th>
              <th className="py-2 sm:py-3 font-medium w-[13%]">נצחונות</th>
              <th className="py-2 sm:py-3 font-medium w-[10%]">רצף</th>
            </tr>
          </thead>
          <tbody>
            {alltime.map((row) => (
              <tr key={row.user_id} className="border-b last:border-0">
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
