import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"

/** GET /api/users/search?q=<prefix> — username autocomplete (excludes self) */
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? ""
  if (q.length < 2) return NextResponse.json([])

  const service = createServiceClient()
  const { data, error } = await service
    .from("users")
    .select("id, username")
    .ilike("username", `${q}%`)
    .neq("id", user.id)
    .order("username")
    .limit(8)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
