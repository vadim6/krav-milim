"use client"

import { useState, useEffect } from "react"

interface UserRow {
  id:         string
  username:   string | null
  email:      string
  created_at: string
  game_count: number
}

type ConfirmAction = { type: "reset" | "delete"; userId: string }

export default function AdminUsersPage() {
  const [users, setUsers]       = useState<UserRow[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [confirming, setConfirm] = useState<ConfirmAction | null>(null)
  const [rowMsg, setRowMsg]     = useState<Record<string, string>>({})  // userId → message
  const [working, setWorking]   = useState<string | null>(null)         // userId being acted on

  async function load() {
    setLoading(true)
    const res = await fetch("/api/admin/users")
    if (res.ok) setUsers(await res.json())
    else setError("שגיאה בטעינת משתמשים")
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function showMsg(userId: string, msg: string) {
    setRowMsg(prev => ({ ...prev, [userId]: msg }))
    setTimeout(() => setRowMsg(prev => { const n = { ...prev }; delete n[userId]; return n }), 4000)
  }

  async function doDelete(id: string) {
    setWorking(id)
    setConfirm(null)
    const res = await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" })
    if (res.ok) {
      setUsers(u => u.filter(x => x.id !== id))
    } else {
      const data = await res.json()
      showMsg(id, data.error ?? "שגיאה")
    }
    setWorking(null)
  }

  async function doResetResult(id: string) {
    setWorking(id)
    setConfirm(null)
    const res = await fetch(`/api/admin/testing?target=user_result&userId=${id}`, { method: "DELETE" })
    const data = await res.json()
    showMsg(id, res.ok ? (data.message ?? "נמחק") : (data.error ?? "שגיאה"))
    setWorking(null)
  }

  if (loading) return <p className="text-gray-500 py-10">טוען…</p>
  if (error)   return <p className="text-red-400 py-10">{error}</p>

  return (
    <div className="max-w-2xl flex flex-col gap-6">
      <h1 className="text-2xl font-bold">משתמשים ({users.length})</h1>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-500 border-b border-gray-800 text-right">
            <th className="pb-2 font-normal">שם משתמש</th>
            <th className="pb-2 font-normal">אימייל</th>
            <th className="pb-2 font-normal text-center">משחקים</th>
            <th className="pb-2 font-normal">הצטרף</th>
            <th className="pb-2" />
          </tr>
        </thead>
        <tbody>
          {users.map(u => {
            const isConfirming = confirming?.userId === u.id
            const isWorking    = working === u.id
            const msg          = rowMsg[u.id]

            return (
              <tr key={u.id} className="border-b border-gray-800/50 group">
                <td className="py-2.5 font-medium">
                  {u.username ?? <span className="text-gray-600 italic">ללא שם</span>}
                </td>
                <td className="py-2.5 text-gray-400 text-xs">{u.email}</td>
                <td className="py-2.5 text-center text-gray-400">{u.game_count}</td>
                <td className="py-2.5 text-gray-500 text-xs">
                  {new Date(u.created_at).toLocaleDateString("he-IL")}
                </td>
                <td className="py-2.5 text-left min-w-[200px]">
                  {isWorking ? (
                    <span className="text-xs text-gray-500">פועל…</span>
                  ) : msg ? (
                    <span className={`text-xs ${msg.includes("שגיאה") || msg.includes("error") ? "text-red-400" : "text-green-400"}`}>
                      {msg}
                    </span>
                  ) : isConfirming ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">
                        {confirming.type === "delete" ? "למחוק?" : "לאפס יום?"}
                      </span>
                      <button
                        onClick={() => confirming.type === "delete" ? doDelete(u.id) : doResetResult(u.id)}
                        className={`text-xs px-2.5 py-1 rounded font-medium transition-colors ${
                          confirming.type === "delete"
                            ? "bg-red-700 hover:bg-red-600 text-white"
                            : "bg-amber-700 hover:bg-amber-600 text-white"
                        }`}
                      >
                        כן
                      </button>
                      <button
                        onClick={() => setConfirm(null)}
                        className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                      >
                        ביטול
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-3 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setConfirm({ type: "reset", userId: u.id })}
                        className="text-amber-500 hover:text-amber-400 text-xs transition-colors"
                      >
                        אפס יום
                      </button>
                      <button
                        onClick={() => setConfirm({ type: "delete", userId: u.id })}
                        className="text-gray-600 hover:text-red-400 text-xs transition-colors"
                      >
                        מחק
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {users.length === 0 && (
        <p className="text-gray-500 text-sm text-center py-8">אין משתמשים רשומים</p>
      )}
    </div>
  )
}
