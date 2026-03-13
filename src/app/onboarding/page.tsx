"use client"

import { Suspense, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { randomAvatarConfig } from "@/lib/avatar/random"

// useSearchParams must be inside a Suspense boundary for static rendering
export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingForm />
    </Suspense>
  )
}

function OnboardingForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const next         = searchParams.get("next") ?? "/game"

  const [username, setUsername]     = useState("")
  const [loading, setLoading]       = useState(false)
  const [checking, setChecking]     = useState(false)
  const [available, setAvailable]   = useState<boolean | null>(null)
  const [error, setError]           = useState<string | null>(null)

  // Debounced availability check
  useEffect(() => {
    if (username.length < 2) { setAvailable(null); return }
    const t = setTimeout(async () => {
      setChecking(true)
      const supabase = createClient()
      const { data } = await supabase
        .from("users")
        .select("id")
        .eq("username", username)
        .maybeSingle()
      setAvailable(!data)
      setChecking(false)
    }, 400)
    return () => clearTimeout(t)
  }, [username])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!available) return
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/login"); return }

    const { error } = await supabase
      .from("users")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ username, avatar_config: randomAvatarConfig() as any })
      .eq("id", user.id)

    if (error) {
      setError(
        error.code === "23505"
          ? "הכינוי הזה כבר תפוס, נסה אחר"
          : error.message,
      )
      setAvailable(false)
      setLoading(false)
      return
    }

    router.push(next)
  }

  const showAvailability = username.length >= 2 && !checking

  return (
    <div className="flex min-h-dvh items-center justify-center p-4 bg-gray-50 dark:bg-gray-950">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 p-8 shadow-lg space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold">בחר כינוי</h1>
          <p className="text-sm text-gray-500">
            זה השם שיופיע לכולם בלוחות התוצאות
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <div className="relative">
              <input
                type="text"
                required
                minLength={2}
                maxLength={30}
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value.trim())
                  setAvailable(null)
                  setError(null)
                }}
                placeholder="wordmaster"
                autoFocus
                autoComplete="username"
                className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 dark:bg-gray-800 ${
                  showAvailability
                    ? available
                      ? "border-green-400 focus:ring-green-500"
                      : "border-red-400 focus:ring-red-400"
                    : "border-gray-300 focus:ring-green-500 dark:border-gray-600"
                }`}
              />
              {username.length >= 2 && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">
                  {checking ? "⏳" : available ? "✅" : "❌"}
                </span>
              )}
            </div>

            {showAvailability && (
              <p className={`text-xs ${available ? "text-green-600" : "text-red-500"}`}>
                {available ? "הכינוי פנוי!" : "הכינוי תפוס, נסה אחר"}
              </p>
            )}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading || !available}
            className="w-full rounded-lg bg-green-600 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-40 transition-colors"
          >
            {loading ? "שומר…" : "בואו נשחק!"}
          </button>
        </form>
      </div>
    </div>
  )
}
