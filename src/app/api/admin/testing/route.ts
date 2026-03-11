import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"

function isAdmin(email: string | undefined) {
  return !!process.env.ADMIN_EMAIL && email === process.env.ADMIN_EMAIL
}

/**
 * DELETE /api/admin/testing?target=my_result
 *   Deletes the admin's game_result for today's word so they can replay it.
 *
 * DELETE /api/admin/testing?target=user_result&userId=<id>
 *   Deletes a specific user's result for today's word.
 */
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!isAdmin(user?.email)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const service = createServiceClient()
  const today   = new Date().toISOString().split("T")[0]
  const target  = req.nextUrl.searchParams.get("target")

  // Resolve today's word id
  const { data: word } = await service
    .from("words")
    .select("id")
    .eq("source", "daily_global")
    .eq("date", today)
    .single()

  if (!word) return NextResponse.json({ error: "No word for today" }, { status: 404 })

  if (target === "my_result") {
    const { error } = await service
      .from("game_results")
      .delete()
      .eq("user_id", user!.id)
      .eq("word_id", word.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, message: "התוצאה שלך נמחקה — תוכל לשחק שוב" })
  }

  if (target === "user_result") {
    const userId = req.nextUrl.searchParams.get("userId")
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 })

    const { error } = await service
      .from("game_results")
      .delete()
      .eq("user_id", userId)
      .eq("word_id", word.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, message: "התוצאה נמחקה" })
  }

  if (target === "all_results") {
    const { error } = await service
      .from("game_results")
      .delete()
      .eq("word_id", word.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, message: "כל התוצאות להיום נמחקו" })
  }

  return NextResponse.json({ error: "Unknown target" }, { status: 400 })
}
