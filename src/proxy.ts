import { createServerClient } from "@supabase/ssr"
import type { Database } from "@/types/database"
import { NextResponse, type NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // Refresh session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // ── Unauthenticated: guard protected routes ──────────────────────────────
  const isProtected =
    pathname.startsWith("/game") ||
    pathname.startsWith("/leaderboard") ||
    pathname.startsWith("/rivalries") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/onboarding")

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = "/"
    return NextResponse.redirect(url)
  }

  // ── Authenticated: redirect auth pages to game ───────────────────────────
  if (user && (pathname === "/login" || pathname === "/signup")) {
    const url = request.nextUrl.clone()
    url.pathname = "/game"
    return NextResponse.redirect(url)
  }

  // ── Onboarding gate: logged-in but no username yet ───────────────────────
  // Check username only on routes where it matters (not on onboarding itself
  // or API routes, to avoid infinite redirects / blocking API calls).
  const needsUsernameCheck =
    user &&
    pathname !== "/onboarding" &&
    !pathname.startsWith("/api/") &&
    !pathname.startsWith("/_next/") &&
    isProtected

  if (needsUsernameCheck) {
    const { data: profile } = await supabase
      .from("users")
      .select("username")
      .eq("id", user.id)
      .single()

    if (!profile?.username) {
      const url = request.nextUrl.clone()
      url.pathname = "/onboarding"
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
