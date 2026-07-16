"use client"

/**
 * niko-table — created by Semir N. (Semkoo, https://github.com/Semkoo) with AI assistance.
 *
 * Before reporting anything: please check the changelog first.
 *  - In-repo: ./CHANGELOG.md
 *  - Docs site: https://niko-table.com/changelog
 *
 * Found a bug or have a fix? Open an issue or PR on GitHub so other
 * users (and future LLMs reading this code) benefit:
 * https://github.com/Semkoo/niko-table-registry
 */

/**
 * Opt-in `localStorage` persistence for column widths.
 *
 * Column resizing is controlled state (`columnSizing`) on `<DataTableRoot>`, so
 * to make resized widths survive reloads you own that state. This hook does it
 * for you: wire the returned `columnSizing` + `onColumnSizingChange` into the
 * table and you're done.
 *
 * @example
 * const { columnSizing, onColumnSizingChange } =
 *   useColumnSizingPersistence(`orders-table:${orgId}`)
 *
 * <DataTableRoot
 *   data={rows}
 *   columns={columns}
 *   state={{ columnSizing }}
 *   onColumnSizingChange={onColumnSizingChange}
 * >
 *   <DataTable>
 *     <DataTableHeader />
 *     <DataTableBody />
 *   </DataTable>
 *   <DataTableColumnResize />
 * </DataTableRoot>
 *
 * Notes:
 * - Writes immediately. Resizing runs in `onEnd` mode, so this fires once per
 *   drag (not per frame), and an immediate write can't be lost on a hard
 *   refresh the way a debounced one can.
 * - SSR note: `localStorage` is only read on the client, so nothing crashes on
 *   the server — but in an SSR framework the client's first (hydration) render
 *   already has the stored widths while the server HTML was rendered with
 *   `{}`, so React may log a hydration-mismatch warning for the width styles
 *   and reconcile. Cosmetic, but if the warning matters to you, load the
 *   widths in an effect instead (accepting a default-width first paint).
 * - Corrupt / hand-edited storage is ignored (non-object, or non-finite
 *   widths) so a bad value never reaches `column.getSize()`.
 * - Scope the `storageKey` per table (and per tenant/user if widths shouldn't
 *   be shared), e.g. `"orders-table:${orgId}"`.
 */
import type { ColumnSizingState, OnChangeFn } from "@tanstack/react-table"
import * as React from "react"

/** Coerce untrusted storage into a valid `{ [columnId]: number }` map. */
function sanitize(value: unknown): ColumnSizingState {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {}
  const result: ColumnSizingState = {}
  for (const [id, width] of Object.entries(value)) {
    if (typeof width === "number" && Number.isFinite(width) && width > 0) {
      result[id] = width
    }
  }
  return result
}

/** Shallow content equality, so an identical re-read keeps state identity. */
function sizingEqual(a: ColumnSizingState, b: ColumnSizingState): boolean {
  const aKeys = Object.keys(a)
  if (aKeys.length !== Object.keys(b).length) return false
  return aKeys.every(id => a[id] === b[id])
}

function readStored(key: string): ColumnSizingState {
  if (typeof window === "undefined") return {}
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? sanitize(JSON.parse(raw)) : {}
  } catch {
    return {}
  }
}

function writeStored(key: string, value: ColumnSizingState): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Quota / private mode — silently skip persistence.
  }
}

export interface ColumnSizingPersistence {
  /** Controlled widths to pass to `<DataTableRoot state={{ columnSizing }} />`. */
  columnSizing: ColumnSizingState
  /** Pass to `<DataTableRoot onColumnSizingChange={...} />`. */
  onColumnSizingChange: OnChangeFn<ColumnSizingState>
  /** Clear the stored widths and reset every column to its declared size. */
  resetColumnSizing: () => void
}

export function useColumnSizingPersistence(
  storageKey: string,
): ColumnSizingPersistence {
  const [columnSizing, setColumnSizing] = React.useState<ColumnSizingState>(
    () => readStored(storageKey),
  )

  // Kept current by the setters below, so they read the latest widths without a
  // render-time ref write and never re-create on unrelated renders.
  const columnSizingRef = React.useRef(columnSizing)

  // Re-load when the key changes (e.g. switching tenant / scope). Skips when
  // the content already matches (the mount run after the initializer, or a
  // key change landing on identical data), so no wasted re-render and no
  // identity churn for consumers keyed on `columnSizing` (e.g. auto-fit).
  React.useEffect(() => {
    const next = readStored(storageKey)
    if (sizingEqual(columnSizingRef.current, next)) return
    columnSizingRef.current = next
    setColumnSizing(next)
  }, [storageKey])

  const onColumnSizingChange = React.useCallback<OnChangeFn<ColumnSizingState>>(
    updater => {
      const next =
        typeof updater === "function"
          ? updater(columnSizingRef.current)
          : updater
      columnSizingRef.current = next
      setColumnSizing(next)
      writeStored(storageKey, next)
    },
    [storageKey],
  )

  const resetColumnSizing = React.useCallback(() => {
    columnSizingRef.current = {}
    setColumnSizing({})
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(storageKey)
      } catch {
        // Ignore.
      }
    }
  }, [storageKey])

  return { columnSizing, onColumnSizingChange, resetColumnSizing }
}
