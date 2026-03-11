"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

export default function SignupPage() {
  const [username, setUsername] = useState("")
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    // signUp passes username via metadata → picked up by handle_new_user trigger
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
        emailRedirectTo: `${location.origin}/api/auth/callback`,
      },
    })

    if (error) {
      setError(
        error.message.includes("already registered")
          ? "כתובת האימייל כבר רשומה. נסה להתחבר."
          : error.message,
      )
      setLoading(false)
      return
    }

    // Supabase sends a confirmation email; let the user know
    setError("נשלח אימות לאימייל שלך. אשר אותו כדי להיכנס.")
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

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-center">הרשמה</h1>

      {/* Google — skips the form entirely, username picked on onboarding */}
      <button
        onClick={handleGoogle}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 rounded-lg border border-gray-300 py-2.5 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
      >
        <GoogleIcon />
        הירשם עם Google
      </button>

      <Divider />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            כינוי (ייחודי, גלוי לכולם)
          </label>
          <input
            type="text"
            required
            minLength={2}
            maxLength={30}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="wordmaster"
            autoComplete="username"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-800"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            אימייל
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            dir="ltr"
            autoComplete="email"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-800"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            סיסמה
          </label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            dir="ltr"
            autoComplete="new-password"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-800"
          />
          <p className="text-xs text-gray-400">לפחות 8 תווים</p>
        </div>

        {error && (
          <p className={`text-sm ${error.includes("אימות") ? "text-green-600" : "text-red-500"}`}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-green-600 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "נרשם…" : "צור חשבון"}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500">
        יש לך כבר חשבון?{" "}
        <Link href="/login" className="font-medium text-green-600 hover:underline">
          התחבר
        </Link>
      </p>
    </div>
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
