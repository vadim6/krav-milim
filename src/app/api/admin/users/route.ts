import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"

function isAdmin(email: string | undefined) {
  return !!process.env.ADMIN_EMAIL && email === process.env.ADMIN_EMAIL
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!isAdmin(user?.email)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const service = createServiceClient()

  // Users with game count
  const { data, error } = await service
    .from("users")
    .select(`
      id,
      username,
      email,
      created_at,
      game_results(count)
    `)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = (data ?? []).map(u => ({
    id:         u.id,
    username:   u.username,
    email:      u.email,
    created_at: u.created_at,
    game_count: (u.game_results as unknown as { count: number }[])[0]?.count ?? 0,
  }))

  return NextResponse.json(rows)
}

/** DELETE /api/admin/users?id=<userId> — deletes user from auth + public.users (cascade) */
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!isAdmin(user?.email)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const id = req.nextUrl.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
  if (id === user!.id) return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 })

  const service = createServiceClient()

  // Delete from auth (cascades to public.users via trigger)
  const { error } = await service.auth.admin.deleteUser(id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
