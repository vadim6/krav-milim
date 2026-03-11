"use client"

import { useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"

/**
 * Subscribe to realtime changes on game_results for a given word.
 * Foundation for ghost mode (seeing opponent guess count in real time).
 */
export function useGameRealtime(
  wordId: string | null,
  onUpdate: (payload: { user_id: string; guesses: number; solved: boolean }) => void,
) {
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!wordId) return

    const supabase = createClient()
    const channel  = supabase
      .channel(`game-results-${wordId}`)
      .on(
        "postgres_changes",
        {
          event:  "*",
          schema: "public",
          table:  "game_results",
          filter: `word_id=eq.${wordId}`,
        },
        (payload) => {
          const row = payload.new as { user_id: string; guesses: number; solved: boolean }
          onUpdate({ user_id: row.user_id, guesses: row.guesses, solved: row.solved })
        },
      )
      .subscribe()

    channelRef.current = channel
    return () => { channel.unsubscribe() }
  }, [wordId, onUpdate])
}
