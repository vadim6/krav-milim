"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"

type NemesisSummary = {
  rivalry_id:          string | null
  status:              "pending" | "active" | "declined" | "completed" | null
  challenger_id:       string | null
  challenger_username: string | null
  challenger_wins:     number | null
  receiver_id:         string | null
  receiver_username:   string | null
  receiver_wins:       number | null
  draws:               number | null
  rounds_played:       number | null
}

type RivalriesData = {
  pending_incoming: NemesisSummary[]
  pending_outgoing: NemesisSummary[]
  active:           NemesisSummary[]
}

type UserResult = { id: string; username: string }

export default function NemesisPage() {
  const [data, setData]           = useState<RivalriesData | null>(null)
  const [myId, setMyId]           = useState<string | null>(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)

  // Challenge form
  const [query, setQuery]         = useState("")
  const [suggestions, setSugg]    = useState<UserResult[]>([])
  const [challenging, setChallenging] = useState(false)
  const [challengeMsg, setChallengeMsg] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const [rivalRes, userRes] = await Promise.all([
      fetch("/api/rivalries/nemesis"),
      fetch("/api/users/me"),
    ])
    if (!rivalRes.ok) { setError("Failed to load"); setLoading(false); return }
    setData(await rivalRes.json())
    if (userRes.ok) {
      const u = await userRes.json()
      setMyId(u.id)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Autocomplete username search
  useEffect(() => {
    if (query.length < 2) { setSugg([]); return }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`)
      if (res.ok) setSugg(await res.json())
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  async function sendChallenge(username: string) {
    setChallenging(true)
    setChallengeMsg(null)
    const res = await fetch("/api/rivalries/nemesis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", receiverUsername: username }),
    })
    const body = await res.json()
    if (res.ok) {
      setChallengeMsg(`אתגר נשלח ל-${username}!`)
      setQuery("")
      setSugg([])
      load()
    } else {
      setChallengeMsg(body.error ?? "שגיאה")
    }
    setChallenging(false)
  }

  async function respond(rivalryId: string, accept: boolean) {
    await fetch("/api/rivalries/nemesis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "respond", rivalryId, accept }),
    })
    load()
  }

  if (loading) return <div className="p-8 text-center text-gray-400">טוען…</div>
  if (error)   return <div className="p-8 text-red-500">{error}</div>

  const { pending_incoming = [], pending_outgoing = [], active = [] } = data ?? {}

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">יריבויות נמסיס</h1>
        <Link href="/rivalries" className="text-sm text-gray-400 hover:text-gray-200">← חזרה</Link>
      </div>

      {/* Pending incoming */}
      {pending_incoming.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-semibold text-yellow-400">אתגרים ממתינים</h2>
          {pending_incoming.map(r => (
            <div key={r.rivalry_id} className="flex items-center justify-between rounded-xl border border-yellow-700 bg-yellow-950/30 px-4 py-3">
              <span className="font-medium">{r.challenger_username} מאתגר אותך</span>
              <div className="flex gap-2">
                <button
                  onClick={() => respond(r.rivalry_id!, true)}
                  className="rounded-lg bg-green-700 hover:bg-green-600 px-3 py-1.5 text-sm font-medium text-white transition-colors"
                >
                  קבל
                </button>
                <button
                  onClick={() => respond(r.rivalry_id!, false)}
                  className="rounded-lg bg-gray-700 hover:bg-gray-600 px-3 py-1.5 text-sm font-medium text-white transition-colors"
                >
                  דחה
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Pending outgoing */}
      {pending_outgoing.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-semibold text-gray-400">אתגרים שנשלחו</h2>
          {pending_outgoing.map(r => (
            <div key={r.rivalry_id} className="flex items-center justify-between rounded-xl border border-gray-700 px-4 py-3 text-gray-400">
              <span>ממתין לתגובה מ-{r.receiver_username}</span>
              <span className="text-xs">ממתין…</span>
            </div>
          ))}
        </section>
      )}

      {/* Active rivalries */}
      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">יריבויות פעילות</h2>
        {active.length === 0 ? (
          <p className="text-sm text-gray-500">אין יריבויות פעילות עדיין.</p>
        ) : (
          active.map(r => {
            const iAmChallenger = r.challenger_id === myId
            const opponentName  = iAmChallenger ? r.receiver_username  : r.challenger_username
            const myWins        = iAmChallenger ? (r.challenger_wins ?? 0) : (r.receiver_wins ?? 0)
            const theirWins     = iAmChallenger ? (r.receiver_wins ?? 0)  : (r.challenger_wins ?? 0)
            return (
              <Link
                key={r.rivalry_id}
                href={`/rivalries/nemesis/${r.rivalry_id}`}
                className="flex items-center justify-between rounded-xl border border-gray-700 px-4 py-3 hover:bg-gray-800 transition-colors"
              >
                <div>
                  <p className="font-semibold">{opponentName}</p>
                  <p className="text-xs text-gray-500">{r.rounds_played ?? 0} סיבובים · {r.draws ?? 0} תיקו</p>
                </div>
                <span className="text-lg font-bold tabular-nums">{myWins}–{theirWins}</span>
              </Link>
            )
          })
        )}
      </section>

      {/* Challenge form */}
      <section className="flex flex-col gap-3 rounded-xl border border-gray-700 p-5">
        <h2 className="font-semibold">אתגר שחקן</h2>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="חפש שם משתמש…"
            className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          {suggestions.length > 0 && (
            <ul className="absolute top-full mt-1 w-full rounded-lg border border-gray-600 bg-gray-800 shadow-lg z-10 overflow-hidden">
              {suggestions.map(u => (
                <li key={u.id}>
                  <button
                    onClick={() => sendChallenge(u.username)}
                    disabled={challenging}
                    className="w-full px-4 py-2.5 text-right text-sm hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    {u.username}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {challengeMsg && (
          <p className={`text-sm ${challengeMsg.startsWith("שגיאה") || challengeMsg.includes("error") || challengeMsg.includes("not") ? "text-red-400" : "text-green-400"}`}>
            {challengeMsg}
          </p>
        )}
      </section>
    </div>
  )
}
