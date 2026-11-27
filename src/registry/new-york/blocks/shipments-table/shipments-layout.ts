/*
 * Pinning and visibility persistence. Widths are saved by the library's
 * `useColumnSizingPersistence` under their own key; this saves the rest of
 * the layout under another, with guards for SSR and corrupt JSON.
 */
import * as React from "react"

export type Pinning = { start: string[]; end: string[] }
export type Visibility = Record<string, boolean>
type Layout = { pinning: Pinning; visibility: Visibility }
type Updater<T> = T | ((old: T) => T)

export const SIZING_KEY = "shipments-table:sizing"
export const LAYOUT_KEY = "shipments-table:layout"

/** Tracking ID stays on the left and the row menu on the right. */
export const DEFAULT_PINNING: Pinning = {
  start: ["tracking"],
  end: ["actions"],
}

/** Data columns the reader may hide. The actions column never hides. */
const HIDEABLE = [
  "tracking",
  "route",
  "carrier",
  "service",
  "status",
  "shippedAt",
  "eta",
  "weightKg",
  "pieces",
  "costUsd",
  "recipient",
  "reference",
]
const PINNABLE = [...HIDEABLE, "actions"]

const DEFAULT_LAYOUT: Layout = { pinning: DEFAULT_PINNING, visibility: {} }

/** Known ids only, no repeats; undefined when the value is not a string list. */
function ids(value: unknown, known: string[]): string[] | undefined {
  if (!Array.isArray(value) || !value.every(i => typeof i === "string")) {
    return undefined
  }
  return [...new Set(value as string[])].filter(id => known.includes(id))
}

/** Each field falls back to its default when missing or the wrong shape. */
function read(): Layout {
  if (typeof window === "undefined") return DEFAULT_LAYOUT
  try {
    const raw: unknown = JSON.parse(
      window.localStorage.getItem(LAYOUT_KEY) ?? "null",
    )
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      return DEFAULT_LAYOUT
    }
    const { pinning, visibility } = raw as Record<string, unknown>
    const p = (pinning && typeof pinning === "object" ? pinning : {}) as Record<
      string,
      unknown
    >
    const start = ids(p.start, PINNABLE) ?? DEFAULT_PINNING.start
    const end = (ids(p.end, PINNABLE) ?? DEFAULT_PINNING.end).filter(
      id => !start.includes(id),
    )
    const v =
      visibility && typeof visibility === "object" && !Array.isArray(visibility)
        ? Object.entries(visibility)
        : []
    return {
      pinning: { start, end },
      visibility: Object.fromEntries(
        v.filter(
          ([id, shown]) => HIDEABLE.includes(id) && typeof shown === "boolean",
        ),
      ),
    }
  } catch {
    return DEFAULT_LAYOUT
  }
}

function write(layout: Layout | null) {
  if (typeof window === "undefined") return
  try {
    if (layout) window.localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout))
    else window.localStorage.removeItem(LAYOUT_KEY)
  } catch {
    // Quota or private mode: skip persistence.
  }
}

/**
 * Pinning and visibility state, saved on every change. The first render uses
 * the defaults (so server and client HTML match); the saved layout is applied
 * right after mount.
 */
export function useLayoutPersistence() {
  const [layout, setLayout] = React.useState<Layout>(DEFAULT_LAYOUT)
  const layoutRef = React.useRef(layout)

  React.useEffect(() => {
    const stored = read()
    layoutRef.current = stored
    setLayout(stored)
  }, [])

  const change = React.useCallback(
    <K extends keyof Layout>(key: K, updater: Updater<Layout[K]>) => {
      const old = layoutRef.current
      const next = {
        ...old,
        [key]: typeof updater === "function" ? updater(old[key]) : updater,
      }
      layoutRef.current = next
      setLayout(next)
      write(next)
    },
    [],
  )

  const onColumnPinningChange = React.useCallback(
    (updater: Updater<Pinning>) => change("pinning", updater),
    [change],
  )
  const onColumnVisibilityChange = React.useCallback(
    (updater: Updater<Visibility>) => change("visibility", updater),
    [change],
  )
  const resetLayout = React.useCallback(() => {
    write(null)
    layoutRef.current = DEFAULT_LAYOUT
    setLayout(DEFAULT_LAYOUT)
  }, [])

  return {
    columnPinning: layout.pinning,
    columnVisibility: layout.visibility,
    onColumnPinningChange,
    onColumnVisibilityChange,
    resetLayout,
  }
}
