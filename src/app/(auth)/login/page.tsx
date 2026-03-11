"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

type Tab = "password" | "magic"

export default function LoginPage() {
  const router = useRouter()
  const [tab, setTab]           = useState<Tab>("password")
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading]   = useState(false)
  const [sent, setSent]         = useState(false)
  const [error, setError]       = useState<string | null>(null)

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(
        error.message === "Invalid login credentials"
          ? "אימייל או סיסמה שגויים"
          : error.message,
      )
      setLoading(false)
    } else {
      router.push("/game")
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/api/auth/callback` },
    })
    if (error) { setError(error.message) } else { setSent(true) }
    setLoading(false)
  }

  async function handleGoogle() {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/api/auth/callback` },
    })
  }

  if (sent) {
    return (
      <div className="text-center space-y-3">
        <p className="text-3xl">📬</p>
        <h1 className="text-xl font-bold">בדוק את האימייל שלך</h1>
        <p className="text-sm text-gray-500">שלחנו קישור כניסה ל‑{email}</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-center">כניסה</h1>

      {/* Google OAuth */}
      <button
        onClick={handleGoogle}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 rounded-lg border border-gray-300 py-2.5 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
      >
        <GoogleIcon />
        המשך עם Google
      </button>

      <Divider />

      {/* Tab: password / magic link */}
      <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1 gap-1">
        {(["password", "magic"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setError(null) }}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
              tab === t
                ? "bg-white dark:bg-gray-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {t === "password" ? "סיסמה" : "קישור במייל"}
          </button>
        ))}
      </div>

      {tab === "password" ? (
        <form onSubmit={handlePassword} className="space-y-4">
          <Field label="אימייל" value={email} onChange={setEmail} type="email" dir="ltr" />
          <Field label="סיסמה" value={password} onChange={setPassword} type="password" dir="ltr" />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <SubmitButton loading={loading} label="כניסה" loadingLabel="נכנס…" />
        </form>
      ) : (
        <form onSubmit={handleMagicLink} className="space-y-4">
          <Field label="אימייל" value={email} onChange={setEmail} type="email" dir="ltr" />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <SubmitButton loading={loading} label="שלח קישור כניסה" loadingLabel="שולח…" />
        </form>
      )}

      <p className="text-center text-sm text-gray-500">
        אין לך חשבון?{" "}
        <Link href="/signup" className="font-medium text-green-600 hover:underline">
          הירשם
        </Link>
      </p>
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function Field({ label, value, onChange, type, dir }: {
  label: string; value: string; onChange: (v: string) => void
  type: string; dir?: "ltr" | "rtl"
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <input
        type={type}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        dir={dir}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-800"
      />
    </div>
  )
}

function SubmitButton({ loading, label, loadingLabel }: {
  loading: boolean; label: string; loadingLabel: string
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full rounded-lg bg-green-600 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
    >
      {loading ? loadingLabel : label}
    </button>
  )
}

function Divider() {
  return (
    <div className="flex items-center gap-3 text-gray-400 text-xs">
      <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
      או
      <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.706c-.18-.54-.282-1.117-.282-1.706s.102-1.166.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.962L3.964 6.294C4.672 4.167 6.656 3.58 9 3.58z"/>
    </svg>
  )
}
