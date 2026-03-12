import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"

const COOLDOWN_DAYS = 30
const USERNAME_RE   = /^[\p{L}\p{N}_.-]{2,30}$/u

/** GET /api/users/me — returns the current user's id and username */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const service = createServiceClient()
  const { data } = await service
    .from("users")
    .select("id, username")
    .eq("id", user.id)
    .single()

  if (!data) return NextResponse.json({ error: "User not found" }, { status: 404 })
  return NextResponse.json(data)
}

/** PATCH /api/users/me — update username with 30-day cooldown */
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const newUsername: string = (body.username ?? "").trim()

  if (!USERNAME_RE.test(newUsername)) {
    return NextResponse.json({ error: "שם משתמש לא תקין (2–30 תווים)" }, { status: 400 })
  }

  const service = createServiceClient()

  // Check cooldown
  const { data: current } = await service
    .from("users")
    .select("username, username_changed_at")
    .eq("id", user.id)
    .single()

  if (!current) return NextResponse.json({ error: "User not found" }, { status: 404 })

  if (current.username_changed_at) {
    const daysSince = (Date.now() - new Date(current.username_changed_at).getTime()) / 86_400_000
    if (daysSince < COOLDOWN_DAYS) {
      const daysLeft = Math.ceil(COOLDOWN_DAYS - daysSince)
      return NextResponse.json(
        { error: `תוכל לשנות שם שוב בעוד ${daysLeft} ימים` },
        { status: 429 },
      )
    }
  }

  // Check uniqueness (skip if unchanged)
  if (newUsername !== current.username) {
    const { data: existing } = await service
      .from("users")
      .select("id")
      .eq("username", newUsername)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: "שם המשתמש הזה כבר תפוס" }, { status: 409 })
    }
  }

  const { data: updated, error } = await service
    .from("users")
    .update({ username: newUsername, username_changed_at: new Date().toISOString() })
    .eq("id", user.id)
    .select("username, username_changed_at")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(updated)
}
