"use client"

import { useState, useEffect, useRef } from "react"
import { useGame } from "@/hooks/useGame"
import GameRow from "./GameRow"
import HebrewKeyboard from "./HebrewKeyboard"
import GameStatus from "./GameStatus"
import type { GuessHistoryEntry, RevealedLetters } from "@/types/shared"
import type { StatusText } from "@/lib/game/statusTexts"
import { pickStatusText } from "@/lib/game/statusTexts"
import { MAX_GUESSES } from "@/lib/game/constants"
import { buildRevealedLetters } from "@/lib/game/engine"

interface ExistingResult {
  id:               string
  solved:           boolean
  guesses:          number
  guess_history:    GuessHistoryEntry[]
  revealed_letters: RevealedLetters
}

interface Props {
  wordId:            string
  existingResult:    ExistingResult | null
  initialStreakData: { currentStreak: number; bestStreak: number } | null
}

interface DebugMetrics {
  reason: string
  branch: string
  count: number
  innerWidth: number
  innerHeight: number
  viewportHeight: number
  viewportOffsetTop: number
  viewportPageTop: number
  scrollY: number
  safeArea: number
  boardTop: number
  boardBottom: number
  boardHeight: number
  gridBottom: number
  keyboardTop: number
  keyboardBottom: number
  mobileNavTop: number
  mobileNavHeight: number
  availableHeight: number
  rawTileFixed: number
  rawTile: number
  tile: number
  key: number
  overflowToNav: number
}

function isIOSDevice() {
  const ua = window.navigator.userAgent
  const platform = window.navigator.platform
  const touchPoints = window.navigator.maxTouchPoints ?? 0

  return /iP(ad|hone|od)/.test(ua) || (platform === "MacIntel" && touchPoints > 1)
}

const showGameboardDebug =
  process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_GAMEBOARD_DEBUG === "1"

export default function GameBoard({ wordId, existingResult, initialStreakData }: Props) {
  const { state, dispatch } = useGame(wordId, existingResult, initialStreakData)
  const [statusDismissed, setStatusDismissed] = useState(false)
  const [statusText, setStatusText] = useState<StatusText | null>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const computeCountRef = useRef(0)
  const [debugMetrics, setDebugMetrics] = useState<DebugMetrics | null>(null)

  // Non-iOS browsers stay on the exact production formula.
  // On iOS, measure the actual space between the board top and the fixed mobile nav.
  // This avoids relying on fragile global constants or safe-area reporting.
  // If that would force tiles below the 38px floor, only then shrink the keyboard.
  const [tileSize,     setTileSize]     = useState(68)
  const [keyHeightPx,  setKeyHeightPx]  = useState<number | undefined>(undefined)
  useEffect(() => {
    function compute(reason: string) {
      const viewport = window.visualViewport
      const vh = viewport?.height ?? window.innerHeight
      const safeArea = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue("--safe-area-inset-bottom")
      ) || 0
      const boardRect = boardRef.current?.getBoundingClientRect()
      const mobileNavRect = document.querySelector<HTMLElement>("[data-mobile-nav]")?.getBoundingClientRect()
      const gridRect = boardRef.current?.querySelector<HTMLElement>('[role="grid"]')?.getBoundingClientRect()
      const keyboardRect = document.querySelector<HTMLElement>("[data-keyboard-root]")?.getBoundingClientRect()
      const count = ++computeCountRef.current

      if (!isIOSDevice()) {
        // Production formula: leave desktop Chrome/Firefox and other non-iOS browsers untouched.
        const tile = Math.round(Math.min(68, Math.max(38, (vh - 440) / 6)))
        setTileSize(tile)
        setKeyHeightPx(undefined)
        if (showGameboardDebug) {
          setDebugMetrics({
            reason,
            branch: "non-ios-prod",
            count,
            innerWidth: window.innerWidth,
            innerHeight: window.innerHeight,
            viewportHeight: vh,
            viewportOffsetTop: viewport?.offsetTop ?? 0,
            viewportPageTop: viewport?.pageTop ?? window.scrollY,
            scrollY: window.scrollY,
            safeArea,
            boardTop: boardRect?.top ?? 0,
            boardBottom: boardRect?.bottom ?? 0,
            boardHeight: boardRect?.height ?? 0,
            gridBottom: gridRect?.bottom ?? 0,
            keyboardTop: keyboardRect?.top ?? 0,
            keyboardBottom: keyboardRect?.bottom ?? 0,
            mobileNavTop: mobileNavRect?.top ?? 0,
            mobileNavHeight: mobileNavRect?.height ?? 0,
            availableHeight: (mobileNavRect?.top ?? vh) - (boardRect?.top ?? 0),
            rawTileFixed: (vh - 440) / 6,
            rawTile: 0,
            tile,
            key: 56,
            overflowToNav: (keyboardRect?.bottom ?? 0) - (mobileNavRect?.top ?? vh),
          })
        }
        return
      }

      const boardTop = boardRect?.top ?? 0
      const mobileNavTop = mobileNavRect?.top ?? vh

      // Internal spacing inside GameBoard, excluding tile rows and key heights:
      // grid row gaps(20) + grid/keyboard gap(8) + key row gaps(16) = 44.
      const availableHeight = mobileNavTop - boardTop
      const FIXED_GAPS = 44

      // iOS: keep the stock keyboard whenever that still leaves room for 38px tiles.
      const rawTileFixed = (availableHeight - FIXED_GAPS - 3 * 56) / 6
      let branch = "ios-fixed-keyboard"
      let tile: number
      let key: number | undefined

      if (rawTileFixed >= 38) {
        tile = Math.floor(Math.min(68, rawTileFixed))
        key = undefined
        setTileSize(tile)
        setKeyHeightPx(undefined)
      } else {
        // iOS fallback: shrink keyboard proportionally with tiles only when necessary.
        // When the proportional key would fall below KEY_MIN, fix key at KEY_MIN and solve for
        // tile from the total-height constraint instead. This prevents key-floor-induced overflow.
        const r       = 56 / 68
        const KEY_MIN = 40
        const rawTile = (availableHeight - FIXED_GAPS) / (6 + 3 * r)
        branch = "ios-scaled-keyboard"
        if (rawTile * r >= KEY_MIN) {
          tile = Math.floor(Math.min(68, Math.max(38, rawTile)))
          key  = Math.floor(Math.min(56, tile * r))
        } else {
          // Key at floor: solve tile = (available - gaps - 3*KEY_MIN) / 6
          branch = "ios-key-floor"
          tile = Math.floor(Math.min(68, Math.max(38, (availableHeight - FIXED_GAPS - 3 * KEY_MIN) / 6)))
          key  = KEY_MIN
        }
        setTileSize(tile)
        setKeyHeightPx(key)
      }

      if (showGameboardDebug) {
        const nextKeyboardBottom = keyboardRect?.bottom ?? (gridRect?.bottom ?? boardTop) + 8 + 16 + 3 * (key ?? 56)
        setDebugMetrics({
          reason,
          branch,
          count,
          innerWidth: window.innerWidth,
          innerHeight: window.innerHeight,
          viewportHeight: vh,
          viewportOffsetTop: viewport?.offsetTop ?? 0,
          viewportPageTop: viewport?.pageTop ?? window.scrollY,
          scrollY: window.scrollY,
          safeArea,
          boardTop,
          boardBottom: boardRect?.bottom ?? 0,
          boardHeight: boardRect?.height ?? 0,
          gridBottom: gridRect?.bottom ?? 0,
          keyboardTop: keyboardRect?.top ?? 0,
          keyboardBottom: keyboardRect?.bottom ?? 0,
          mobileNavTop,
          mobileNavHeight: mobileNavRect?.height ?? 0,
          availableHeight,
          rawTileFixed,
          rawTile: (availableHeight - FIXED_GAPS) / (6 + 3 * (56 / 68)),
          tile,
          key: key ?? 56,
          overflowToNav: nextKeyboardBottom - mobileNavTop,
        })
        console.log("[GameBoard debug]", {
          reason,
          branch,
          count,
          innerWidth: window.innerWidth,
          innerHeight: window.innerHeight,
          viewportHeight: vh,
          viewportOffsetTop: viewport?.offsetTop ?? 0,
          viewportPageTop: viewport?.pageTop ?? window.scrollY,
          scrollY: window.scrollY,
          safeArea,
          boardTop,
          boardBottom: boardRect?.bottom ?? 0,
          gridBottom: gridRect?.bottom ?? 0,
          keyboardTop: keyboardRect?.top ?? 0,
          keyboardBottom: keyboardRect?.bottom ?? 0,
          mobileNavTop,
          mobileNavHeight: mobileNavRect?.height ?? 0,
          availableHeight,
          rawTileFixed,
          rawTile: (availableHeight - FIXED_GAPS) / (6 + 3 * (56 / 68)),
          tile,
          key: key ?? 56,
          overflowToNav: nextKeyboardBottom - mobileNavTop,
        })
      }
    }

    let raf1 = 0
    let raf2 = 0
    const timeouts: ReturnType<typeof setTimeout>[] = []

    function scheduleCompute(reason: string) {
      compute(reason)

      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
      timeouts.forEach(clearTimeout)
      timeouts.length = 0

      raf1 = window.requestAnimationFrame(() => {
        compute(`${reason}:raf1`)
        raf2 = window.requestAnimationFrame(() => compute(`${reason}:raf2`))
      })

      ;[120, 300, 600].forEach((delay) => {
        timeouts.push(setTimeout(() => compute(`${reason}:t${delay}`), delay))
      })
    }

    function handlePageShow() {
      scheduleCompute("pageshow")
    }

    function handleResize() {
      scheduleCompute("window-resize")
    }

    function handleViewportResize() {
      scheduleCompute("visualViewport-resize")
    }

    function handleViewportScroll() {
      scheduleCompute("visualViewport-scroll")
    }

    scheduleCompute("mount")
    window.addEventListener("resize", handleResize)
    window.addEventListener("pageshow", handlePageShow)
    window.visualViewport?.addEventListener("resize", handleViewportResize)
    window.visualViewport?.addEventListener("scroll", handleViewportScroll)
    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
      timeouts.forEach(clearTimeout)
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("pageshow", handlePageShow)
      window.visualViewport?.removeEventListener("resize", handleViewportResize)
      window.visualViewport?.removeEventListener("scroll", handleViewportScroll)
    }
  }, [])

  useEffect(() => {
    if (!isIOSDevice()) return

    const htmlOverflow = document.documentElement.style.overflow
    const bodyOverflow = document.body.style.overflow

    document.documentElement.style.overflow = "hidden"
    document.body.style.overflow = "hidden"

    return () => {
      document.documentElement.style.overflow = htmlOverflow
      document.body.style.overflow = bodyOverflow
    }
  }, [])

  // Track game-in-progress for the settings modal's hard-mode guard
  useEffect(() => {
    if (state.guesses.length > 0 && state.gameStatus === "playing") {
      localStorage.setItem("krav-milim-game-in-progress", "true")
    }
  }, [state.guesses.length, state.gameStatus])

  useEffect(() => {
    if (state.gameStatus === "won" || state.gameStatus === "lost") {
      localStorage.setItem("krav-milim-game-in-progress", "false")
    }
  }, [state.gameStatus])

  useEffect(() => {
    if (state.gameStatus === "playing") return
    setStatusText(pickStatusText(state.gameStatus as "won" | "lost", `krav-milim-status-${wordId}`))
  }, [state.gameStatus, wordId])

  // When revealing, compute the keyboard's "before" state so keys can stagger in sync with tiles
  const animatingEntry      = state.isRevealing ? state.guesses[state.guesses.length - 1] : undefined
  const prevRevealedLetters = state.isRevealing ? buildRevealedLetters(state.guesses.slice(0, -1)) : undefined

  const emptyRowCount = Math.max(
    0,
    MAX_GUESSES - state.guesses.length - (state.gameStatus === "playing" ? 1 : 0),
  )

  return (
    <div
      ref={boardRef}
      className="flex h-full min-h-0 w-full flex-col items-center gap-2 overflow-hidden"
      style={{ "--tile-size": `${tileSize}px` } as React.CSSProperties}
    >
      {/* Grid */}
      <div className="relative flex flex-col gap-1" role="grid" aria-label="לוח המשחק">
        {/* Toasts — float over the top of the board */}
        {(state.notInWordList || state.hardModeViolation) && (
          <div className="absolute left-1/2 -translate-x-1/2 top-0 z-50 pointer-events-none">
            {state.notInWordList && (
              <div className="rounded-lg bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 px-5 py-3 text-sm font-semibold shadow-lg animate-fade-in-out whitespace-nowrap">
                המילה אינה מופיעה ברשימת המילים
              </div>
            )}
            {state.hardModeViolation && (
              <div
                className="rounded-lg bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 px-5 py-3 text-sm font-semibold shadow-lg animate-fade-in-out whitespace-nowrap"
                dangerouslySetInnerHTML={{ __html: state.hardModeViolation }}
              />
            )}
          </div>
        )}
        {/* Completed rows */}
        {state.guesses.map((entry, i) => (
          <GameRow
            key={i}
            entry={entry}
            revealed
            animating={state.isRevealing && i === state.guesses.length - 1}
          />
        ))}

        {/* Current input row */}
        {state.gameStatus === "playing" && (
          <GameRow current={state.currentGuess} invalid={state.invalidGuess || state.notInWordList || !!state.hardModeViolation} />
        )}

        {/* Empty rows */}
        {Array.from({ length: emptyRowCount }).map((_, i) => (
          <GameRow key={`empty-${i}`} />
        ))}

        {/* Status overlay — rendered inside the grid so backdrop covers only the board */}
        {state.gameStatus !== "playing" && !statusDismissed && statusText && (
          <GameStatus
            status={state.gameStatus}
            guessCount={state.guesses.length}
            guessHistory={state.guesses}
            answer={state.answer}
            statusText={statusText}
            streakData={state.streakData}
            onDismiss={() => setStatusDismissed(true)}
          />
        )}
      </div>

      {/* Keyboard */}
      <HebrewKeyboard
        revealedLetters={state.revealedLetters}
        prevRevealedLetters={prevRevealedLetters}
        animatingEntry={animatingEntry}
        isRevealing={state.isRevealing}
        keyHeightPx={keyHeightPx}
        onKey={(key) => {
          if (state.gameStatus !== "playing" || state.isRevealing) return
          if (key === "ENTER") {
            dispatch({ type: "SUBMIT_GUESS", result: [] }) // handled in hook
          } else if (key === "DELETE") {
            dispatch({ type: "DELETE_LETTER" })
          } else {
            dispatch({ type: "ADD_LETTER", letter: key })
          }
        }}
      />

      {showGameboardDebug && debugMetrics && (
        <pre className="pointer-events-none fixed left-2 top-20 z-50 max-w-[calc(100vw-1rem)] overflow-auto rounded bg-black/85 px-2 py-1 text-[10px] leading-4 text-green-300 shadow-lg">
{`reason=${debugMetrics.reason}
branch=${debugMetrics.branch}
count=${debugMetrics.count}
inner=${debugMetrics.innerWidth}x${debugMetrics.innerHeight}
vvh=${debugMetrics.viewportHeight.toFixed(1)} top=${debugMetrics.viewportOffsetTop.toFixed(1)} pageTop=${debugMetrics.viewportPageTop.toFixed(1)}
scrollY=${debugMetrics.scrollY.toFixed(1)} safeArea=${debugMetrics.safeArea}
board top=${debugMetrics.boardTop.toFixed(1)} bottom=${debugMetrics.boardBottom.toFixed(1)} h=${debugMetrics.boardHeight.toFixed(1)}
grid bottom=${debugMetrics.gridBottom.toFixed(1)}
keyboard top=${debugMetrics.keyboardTop.toFixed(1)} bottom=${debugMetrics.keyboardBottom.toFixed(1)}
nav top=${debugMetrics.mobileNavTop.toFixed(1)} h=${debugMetrics.mobileNavHeight.toFixed(1)}
available=${debugMetrics.availableHeight.toFixed(1)}
rawFixed=${debugMetrics.rawTileFixed.toFixed(2)} rawScaled=${debugMetrics.rawTile.toFixed(2)}
tile=${debugMetrics.tile} key=${debugMetrics.key}
overflowToNav=${debugMetrics.overflowToNav.toFixed(1)}`}
        </pre>
      )}
    </div>
  )
}
