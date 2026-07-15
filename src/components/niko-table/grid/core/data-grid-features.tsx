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
import * as React from "react"

import type { UseDataGrid } from "../hooks/use-data-grid"
import type {
  CellPosition,
  CopiedRange,
  GridRow,
  SelectionBounds,
} from "../types/grid-cell"

// ---------------------------------------------------------------------------
// Opt-in grid features — the composable seam.
//
// `<DataGrid>` ships only the irreducible core (selection, keyboard nav, the
// scroll seam). Everything else is an opt-in CHILD component that registers
// its capability here when mounted — mix and match, niko-table style:
//
//   <DataGrid grid={grid}>
//     <DataGridClipboard resolveCell={...} />   // copy/cut/paste + marching ants
//     <DataGridFillHandle />                    // corner-drag fill
//     <DataGridMove />                          // border-drag move/copy
//     <DataGridCrossHighlight />                // header + row-number highlight
//     <DataTable>…</DataTable>
//   </DataGrid>
//
// A feature that isn't mounted costs NOTHING: no document/window listeners,
// no per-cell overlays, no state churn — and it tree-shakes out of the bundle.
// ---------------------------------------------------------------------------

/** Published by `<DataGridClipboard>`. */
export interface ClipboardFeature {
  /** The copied rectangle (the marching-ants copy outline), or null. */
  copiedRange: CopiedRange | null
  copySelection: () => void
  cutSelection: () => void
  /** Read the clipboard and paste from the focused cell (menu "Paste"). */
  pasteFromClipboard: () => void
  /** Clear the copy marker (wired to Escape by the core keyboard). */
  clearCopiedRange: () => void
  /** Paste is available (a `resolveCell` was provided). */
  canPaste: boolean
}

/** Published by `<DataGridFillHandle>`. */
export interface FillFeature {
  /** Fill-drag rectangle (source + extension), display space, or null. */
  fillBounds: SelectionBounds | null
  onFillHandleMouseDown: (e: React.MouseEvent) => void
  onFillHandleDoubleClick: () => void
}

/** Published by `<DataGridMove>`. */
export interface MoveFeature {
  /** Drag-to-move ghost rectangle (target landing zone), or null. */
  moveBounds: SelectionBounds | null
  onSelectionMoveMouseDown: (e: React.MouseEvent, grabPos: CellPosition) => void
}

/** Published by `<DataGridRowReorder>`. */
export interface RowReorderFeature {
  /** The row id being dragged (for the handle's grabbing state), or null. */
  draggingRowId: string | null
  /** Start a row-reorder drag from a gutter grab handle. */
  onRowReorderMouseDown: (e: React.MouseEvent, rowId: string) => void
}

export interface GridFeatures {
  clipboard?: ClipboardFeature
  fill?: FillFeature
  move?: MoveFeature
  rowReorder?: RowReorderFeature
}

export type RegisterGridFeature = <K extends keyof GridFeatures>(
  key: K,
  payload: GridFeatures[K] | undefined,
) => void

const FeaturesContext = React.createContext<GridFeatures | null>(null)
const FeatureRegistryContext = React.createContext<RegisterGridFeature | null>(
  null,
)

export function DataGridFeaturesProvider({
  features,
  register,
  children,
}: {
  features: GridFeatures
  register: RegisterGridFeature
  children: React.ReactNode
}) {
  return (
    <FeatureRegistryContext.Provider value={register}>
      <FeaturesContext.Provider value={features}>
        {children}
      </FeaturesContext.Provider>
    </FeatureRegistryContext.Provider>
  )
}

/** Read the currently-registered opt-in features (cells, menus). */
export function useDataGridFeatures(): GridFeatures {
  const ctx = React.useContext(FeaturesContext)
  if (ctx === null) {
    throw new Error("useDataGridFeatures must be used within <DataGrid>")
  }
  return ctx
}

/**
 * Publish a feature payload while mounted; unregisters on unmount. Feature
 * components memoize their payload and call this once.
 */
export function useRegisterGridFeature<K extends keyof GridFeatures>(
  key: K,
  payload: NonNullable<GridFeatures[K]>,
): void {
  const register = React.useContext(FeatureRegistryContext)
  if (register === null) {
    throw new Error(
      "Grid feature components (DataGridClipboard, DataGridFillHandle, …) must be placed inside <DataGrid>",
    )
  }
  React.useEffect(() => {
    register(key, payload)
    return () => register(key, undefined)
  }, [register, key, payload])
}

// ---------------------------------------------------------------------------
// Internals — the shared machinery feature components build on. Deliberately
// exported (registry consumers can write their own features) but NOT part of
// the everyday public API.
// ---------------------------------------------------------------------------

/** px from a scroll-container edge where drag auto-scroll kicks in. */
export const GRID_EDGE_ZONE = 36
/** px per frame while auto-scrolling at an edge. */
export const GRID_EDGE_SPEED = 14

export function clampGridIndex(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

/** The display-order row shape features read (a subset of TanStack's `Row`). */
export interface GridDisplayRow {
  readonly id: string
  readonly original: GridRow
}

/** Latest-snapshot env for once-subscribed listeners / rAF loops. */
export interface GridEnv {
  orderedRows: readonly GridDisplayRow[]
  columnIds: readonly string[]
  displayIndexOf: (id: string) => number | undefined
  grid: UseDataGrid<GridRow>
  selectionBounds: SelectionBounds | null
}

export interface DataGridInternals {
  grid: UseDataGrid<GridRow>
  /** Selection rectangle in DISPLAY space (post filter/sort). */
  selectionBounds: SelectionBounds | null
  orderedRows: readonly GridDisplayRow[]
  columnIds: readonly string[]
  displayIndexOf: (id: string) => number | undefined
  /** Display index → the row's data (lazy TSV serialization). */
  getDisplayRow: (i: number) => GridRow | undefined
  /** Select the whole display-space rectangle (anchor top-left → bottom-right). */
  selectRange: (bounds: SelectionBounds) => void
  /** Clear the selected cells' values. */
  clearSelection: () => void
  /** The grid wrapper element (query the scroll container from here). */
  wrapperRef: React.RefObject<HTMLDivElement | null>
  /** Latest pointer position (updated by the core's window mousemove). */
  pointerRef: React.RefObject<{ x: number; y: number }>
  /** Latest env snapshot for once-subscribed listeners / rAF loops. */
  envRef: React.RefObject<GridEnv>
}

const InternalsContext = React.createContext<DataGridInternals | null>(null)

export function DataGridInternalsProvider({
  value,
  children,
}: {
  value: DataGridInternals
  children: React.ReactNode
}) {
  return (
    <InternalsContext.Provider value={value}>
      {children}
    </InternalsContext.Provider>
  )
}

/** Access the grid's internal machinery (feature components only). */
export function useDataGridInternals(): DataGridInternals {
  const ctx = React.useContext(InternalsContext)
  if (ctx === null) {
    throw new Error("useDataGridInternals must be used within <DataGrid>")
  }
  return ctx
}
