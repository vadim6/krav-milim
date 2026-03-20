import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"

/**
 * POST /api/notifications/telegram/token
 * Generates a 6-digit linking token for the current user.
 * Deletes any existing unexpired tokens for this user first.
 * Returns { token: "123456" }
 */
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const service = createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svc = service as any

  // Clean up any existing tokens for this user
  await svc
    .from("telegram_link_tokens")
    .delete()
    .eq("user_id", user.id)

  // Generate a cryptographically secure 6-digit token
  const token = String(100000 + (new Uint32Array(crypto.getRandomValues(new Uint32Array(1)))[0] % 900000))
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes

  const { error } = await svc
    .from("telegram_link_tokens")
    .insert({ token, user_id: user.id, expires_at: expiresAt })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ token })
}
