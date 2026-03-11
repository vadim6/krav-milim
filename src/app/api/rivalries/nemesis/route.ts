import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"

/**
 * GET /api/rivalries/nemesis
 * Returns { pending_incoming, pending_outgoing, active } rivalries for the current user.
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const service = createServiceClient()

  // Use service client to bypass RLS issues; filter by participant in app layer
  const { data: summaries, error } = await service
    .from("nemesis_summary")
    .select("*")
    .or(`challenger_id.eq.${user.id},receiver_id.eq.${user.id}`)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const all = summaries ?? []
  return NextResponse.json({
    pending_incoming: all.filter(r => r.status === "pending" && r.receiver_id === user.id),
    pending_outgoing: all.filter(r => r.status === "pending" && r.challenger_id === user.id),
    active:           all.filter(r => r.status === "active"),
  })
}

/**
 * POST /api/rivalries/nemesis
 * Body: { action: "create", receiverUsername: string }
 *     | { action: "respond", rivalryId: string, accept: boolean }
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()

  if (body.action === "create") {
    const { receiverUsername } = body
    if (!receiverUsername) {
      return NextResponse.json({ error: "receiverUsername required" }, { status: 400 })
    }

    const { data: receiver } = await supabase
      .from("users")
      .select("id")
      .eq("username", receiverUsername)
      .single()

    if (!receiver) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    if (receiver.id === user.id) {
      return NextResponse.json({ error: "Cannot challenge yourself" }, { status: 422 })
    }

    const { data, error } = await supabase
      .from("nemesis_rivalries")
      .insert({ challenger_id: user.id, receiver_id: receiver.id })
      .select("id")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ rivalryId: data.id }, { status: 201 })
  }

  if (body.action === "respond") {
    const { rivalryId, accept } = body
    const newStatus = accept ? "active" : "declined"

    const { error } = await supabase
      .from("nemesis_rivalries")
      .update({ status: newStatus })
      .eq("id", rivalryId)
      .eq("receiver_id", user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ status: newStatus })
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}
