import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * POST /api/rivalries/chevre
 * Body: { action: "create", name: string, thresholdPct?: number }
 *     | { action: "join", inviteCode: string }
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()

  if (body.action === "create") {
    const { name, thresholdPct = 75 } = body
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "name required" }, { status: 400 })
    }

    // Create group
    const { data: group, error: groupError } = await supabase
      .from("chevre_groups")
      .insert({ name, created_by: user.id, threshold_pct: thresholdPct })
      .select("id, invite_code")
      .single()

    if (groupError || !group) {
      return NextResponse.json({ error: groupError?.message }, { status: 500 })
    }

    // Add creator as admin
    await supabase
      .from("chevre_members")
      .insert({ group_id: group.id, user_id: user.id, role: "admin" })

    return NextResponse.json(group, { status: 201 })
  }

  if (body.action === "join") {
    const { inviteCode } = body
    if (!inviteCode) {
      return NextResponse.json({ error: "inviteCode required" }, { status: 400 })
    }

    const { data: group } = await supabase
      .from("chevre_groups")
      .select("id")
      .eq("invite_code", inviteCode.toUpperCase())
      .single()

    if (!group) {
      return NextResponse.json({ error: "Invalid invite code" }, { status: 404 })
    }

    const { error } = await supabase
      .from("chevre_members")
      .insert({ group_id: group.id, user_id: user.id, role: "member" })

    if (error) {
      // Duplicate = already a member
      if (error.code === "23505") {
        return NextResponse.json({ error: "Already a member" }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ groupId: group.id })
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}
