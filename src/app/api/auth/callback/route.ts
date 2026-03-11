import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import type { Database } from "@/types/database"
import { cookies } from "next/headers"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/game"

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          },
        },
      },
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Check whether this user still needs to pick a username.
      // This covers: Google OAuth first login, magic-link first login.
      const { data: profile } = await supabase
        .from("users")
        .select("username")
        .eq("id", data.user.id)
        .single()

      if (!profile?.username) {
        // Preserve the intended destination so onboarding can redirect there
        const onboardingUrl = new URL("/onboarding", origin)
        if (next !== "/game") onboardingUrl.searchParams.set("next", next)
        return NextResponse.redirect(onboardingUrl.toString())
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
