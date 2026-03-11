import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"

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
