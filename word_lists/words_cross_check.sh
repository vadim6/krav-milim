#!/bin/bash
# verify_words.sh — Check that every word in FILE_A exists in FILE_B
#
# Usage: bash verify_words.sh <words_to_check> <reference_wordlist>
# Example: bash verify_words.sh daily_words.txt hspell_5letter.txt

set -e

FILE_A="$1"
FILE_B="$2"

if [ -z "$FILE_A" ] || [ -z "$FILE_B" ]; then
    echo "Usage: bash verify_words.sh <words_to_check> <reference_wordlist>"
    exit 1
fi

if [ ! -f "$FILE_A" ]; then echo "❌ File not found: $FILE_A"; exit 1; fi
if [ ! -f "$FILE_B" ]; then echo "❌ File not found: $FILE_B"; exit 1; fi

MISSING=$(comm -23 \
    <(grep -v '^#' "$FILE_A" | awk '{print $1}' | sort) \
    <(grep -v '^#' "$FILE_B" | awk '{print $1}' | sort))

TOTAL=$(grep -v '^#' "$FILE_A" | awk '{print $1}' | grep -c '.' || true)

if [ -z "$MISSING" ]; then
    echo "✅ All $TOTAL words in '$FILE_A' are present in '$FILE_B'"
else
    COUNT=$(echo "$MISSING" | grep -c '.' || true)
    echo "⚠️  $COUNT / $TOTAL words from '$FILE_A' are NOT in '$FILE_B':"
    echo ""
    echo "$MISSING"
    exit 1
fi
