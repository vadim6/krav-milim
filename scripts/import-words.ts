/**
 * One-time script to bulk-import a Hebrew word list into the Supabase words table.
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/import-words.ts path/to/words.txt
 *
 * The file should have one word per line.
 * Words are normalized (final-letter forms unified), filtered to exactly 5 letters, and deduplicated.
 * Already-imported words are silently skipped (upsert with ignoreDuplicates).
 */

import { createClient } from '@supabase/supabase-js'
import { normalizeWord } from '../src/lib/game/hebrew'
import fs from 'fs'

const CHUNK_SIZE = 500

async function main() {
  const filePath = process.argv[2]
  if (!filePath) {
    console.error('Usage: npx tsx scripts/import-words.ts <path/to/words.txt>')
    process.exit(1)
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars')
    process.exit(1)
  }

  const supabase = createClient(url, key)

  const raw = fs.readFileSync(filePath, 'utf8').split('\n')
  const words = [
    ...new Set(
      raw
        .map(line => normalizeWord(line.trim()))
        .filter(w => w.length === 5)
    ),
  ]

  console.log(`Found ${words.length} valid unique 5-letter words. Importing...`)

  let imported = 0
  for (let i = 0; i < words.length; i += CHUNK_SIZE) {
    const chunk = words.slice(i, i + CHUNK_SIZE).map(word => ({
      word,
      language: 'he',
      source: 'daily_global' as const,
    }))

    const { error } = await supabase.from('words').upsert(chunk, {
      onConflict: 'word,source',
      ignoreDuplicates: true,
    })

    if (error) {
      console.error(`Error at chunk ${i}–${i + CHUNK_SIZE}:`, error.message)
      process.exit(1)
    }

    imported += chunk.length
    process.stdout.write(`\r${imported}/${words.length}`)
  }

  console.log('\nDone.')
}

main()
